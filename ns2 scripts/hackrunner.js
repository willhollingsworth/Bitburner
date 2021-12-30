/** @param {NS} ns **/
import { run_scan } from 'depthscanner.js';
import {
    calc_weaken_amount,
    calc_growth_amount,
    calc_hack_amount,
} from 'server_info.js';

export async function csv_log(ns, data, debug) {
    await write_csv(ns, data);
    if (debug) {
        await write_csv(ns, data, 'debug_');
    }
}

export async function debug_log(ns, data, debug) {
    if (debug) {
        await write_csv(ns, data, 'debug_');
    }
}

export async function write_csv(ns, data, filename_mod = '') {
    let output = data,
        filename = ns.getScriptName().split('.')[0],
        timestamp = Date().split(' ')[4];
    filename = filename_mod + 'log_csv_' + filename + '.txt';
    output.unshift(timestamp);
    output = output.join(', ');
    await ns.write(filename, output + '\r\n');
    return;
}

export function check_and_get_access(ns, target) {
    if (ns.hasRootAccess(target)) {
        return true;
    }
    let num_ports_req = ns.getServerNumPortsRequired(target),
        num_ports_avail = 0;
    if (ns.fileExists('brutessh.exe', 'home')) {
        ns.brutessh(target);
        num_ports_avail += 1;
    }
    if (ns.fileExists('FTPCrack.exe', 'home')) {
        ns.ftpcrack(target);
        num_ports_avail += 1;
    }
    if (ns.fileExists('relaySMTP.exe', 'home')) {
        ns.relaysmtp(target);
        num_ports_avail += 1;
    }
    if (ns.fileExists('HTTPWorm.exe', 'home')) {
        ns.httpworm(target);
        num_ports_avail += 1;
    }
    if (ns.fileExists('SQLInject.exe', 'home')) {
        ns.sqlinject(target);
        num_ports_avail += 1;
    }
    let port_delta = num_ports_avail - num_ports_req;
    if (port_delta >= 0) {
        ns.nuke(target);
        return true;
    } else {
        return false;
    }
}

export function build_targets_object(ns, ignored_targets, depth) {
    let output_object = {};
    let hosts = run_scan(ns, 'home', depth);
    if (ignored_targets) {
        hosts = hosts.filter((host) => !ignored_targets.includes(host)); //filter unwanted hosts
    }
    hosts = hosts.filter(
        (host) =>
            ns.getServerMoneyAvailable(host) > 1 &&
            host != 'home' &&
            ns.getServerRequiredHackingLevel(host) < ns.getHackingLevel()
    );
    for (let host of hosts) {
        output_object[host] = [0, 0, 0];
    }
    return output_object;
}

export function find_hosts(ns, ignored_hosts = false, depth = 1) {
    let hosts = run_scan(ns, 'home', depth); // build an array of directly and indirectly connected hosts
    hosts.push('home');
    if (ignored_hosts) {
        hosts = hosts.filter((host) => !ignored_hosts.includes(host)); //filter unwanted hosts
    }
    hosts = hosts.filter(
        (host) => check_and_get_access(ns, host) && ns.getServerMaxRam(host) > 0
    );
    return hosts;
}

function build_hosts_and_targets(
    ns,
    ignored_hosts,
    ignored_targets,
    depth,
    host_selection,
    target_selection
) {
    let log_string = [];
    let hosts = find_hosts(ns, ignored_hosts, depth);
    let targets = build_targets_object(ns, ignored_targets, depth);
    if (host_selection.length > 0) {
        hosts = host_selection;
        log_string[0] = 'manual host mode on, ';
    } else {
        log_string[0] = '';
    }

    if (target_selection.length > 0) {
        targets = build_targets_object(ns, target_selection);
        log_string[1] = 'manual target mode on, ';
    } else {
        log_string[1] = '';
    }

    ns.tprint(log_string[0], 'building hosts', hosts.sort());
    ns.tprint(log_string[1], 'building targets', Object.keys(targets).sort());
    return [hosts, targets];
}

export function get_target_info(ns, target) {
    let security_delta = (
            ns.getServerSecurityLevel(target) -
            ns.getServerMinSecurityLevel(target)
        ).toFixed(2),
        money_percent = (
            (ns.getServerMoneyAvailable(target) /
                ns.getServerMaxMoney(target)) *
            100
        ).toFixed(2);

    return [security_delta, money_percent];
}

export async function run_script(ns, target, script, threads, hosts, debug) {
    let reserved_ram = 10,
        attempts = 16;
    script += '.js';
    if (threads < 1 || isNaN(threads)) {
        ns.tprint(
            'run script function fed NaN, target:',
            target,
            ' , script: ',
            script,
            ' , threads: ',
            threads
        );
        return;
    }
    while (attempts > 1) {
        let required_ram = ns.getScriptRam(script) * threads;
        for (let server of hosts) {
            if (!check_and_get_access(ns, server)) {
                continue;
            }
            let free_ram =
                ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
            if (server == 'host') {
                free_ram -= reserved_ram;
            }
            if (free_ram < required_ram) {
                continue;
            }
            // deploy script to server
            if (!ns.fileExists(script, server)) {
                // await debug_log(ns, ['scp script', script, 'to', server], debug);
                await ns.scp(script, 'home', server);
            }
            if (!check_and_get_access(ns, target)) {
                continue;
            }
            ns.exec(script, server, threads, target);
            return threads;
        }
        attempts -= 1;
        threads = Math.floor(threads / 2);
    }
    await csv_log(
        ns,
        [target, 'unable to run', script, threads, attempts],
        debug
    );
    ns.tprint('failed to run -> ', script, 'x', threads, ' -> ', target);
    return;
}

export async function write_headers(ns, debug) {
    //print out headers
    await csv_log(
        ns,
        [
            'target',
            'script',
            'threads',
            'active_weakens',
            'active_grows',
            'active_hacks',
            'security_delta',
            'money_percent',
        ],
        debug
    );
}

export async function main(ns) {
    // var hosts = ns.scan(ns.getHostname()); // build an array of directly connected hosts
    // ns.tail();
    let ignored_hosts = [],
        ignored_targets = ['CSEC'],
        hack_drain_amount = 90, //amount to drain when running a hack operation
        depth = 5, //depth of scanning
        threads = 0,
        launch_threads = 0,
        current_threads = 0,
        debug = true,
        log_details = [],
        //allows manual entering of hosts and targets
        host_selection = [],
        target_selection = [];

    let [hosts, targets] = build_hosts_and_targets(
        ns,
        ignored_hosts,
        ignored_targets,
        depth,
        host_selection,
        target_selection
    );

    await write_headers(ns, debug);

    while (true) {
        for (let target in targets) {
            // loop over each target
            await ns.sleep(500);
            let [security_delta, money_percent] = get_target_info(ns, target);
            log_details = [
                target,
                'action',
                'requirement',
                targets[target],
                security_delta,
                money_percent,
            ];
            // if security is too high
            if (security_delta > 0) {
                // if no active weaken tasks
                let weakens_required = calc_weaken_amount(ns, target);
                current_threads = targets[target][0];
                if (current_threads < weakens_required) {
                    launch_threads = weakens_required - current_threads;
                    threads = await run_script(
                        ns,
                        target,
                        'weaken',
                        launch_threads,
                        hosts,
                        debug
                    );
                    log_details[1] = 'run weaken';
                    log_details[2] = threads;
                    targets[target] = [current_threads + threads, 0, 0];
                    log_details[3] = targets[target];
                    await csv_log(ns, log_details, debug);
                } else {
                    log_details[1] = "can't run weaken";
                    log_details[2] = 'weakens already running';
                    await debug_log(ns, log_details, debug);
                }
            } else if (money_percent < 100) {
                let grows_required = calc_growth_amount(ns, target);
                current_threads = targets[target][1];
                if (current_threads < grows_required) {
                    launch_threads = grows_required - current_threads;
                    threads = await run_script(
                        ns,
                        target,
                        'grow',
                        launch_threads,
                        hosts,
                        debug
                    );
                    log_details[1] = 'run grow';
                    log_details[2] = threads;
                    targets[target] = [0, current_threads + threads, 0];
                    log_details[3] = targets[target];
                    await csv_log(ns, log_details, debug);
                } else {
                    log_details[1] = "can't run grow";
                    log_details[2] = 'grow already running';
                    await debug_log(ns, log_details, debug);
                }
            } else {
                let hacks_required = calc_hack_amount(
                    ns,
                    target,
                    hack_drain_amount
                );
                current_threads = targets[target][2];
                if (current_threads < hacks_required) {
                    launch_threads = hacks_required - current_threads;
                    threads = await run_script(
                        ns,
                        target,
                        'hack',
                        hacks_required,
                        hosts,
                        debug
                    );

                    log_details[1] = 'run hack';
                    log_details[2] = threads;
                    targets[target] = [0, 0, current_threads + threads];
                    log_details[3] = targets[target];
                    await csv_log(ns, log_details, debug);
                } else {
                    log_details[1] = "can't run hack";
                    log_details[2] = 'hacks already running';
                    await debug_log(ns, log_details, debug);
                }
            }
        }
    }
}
