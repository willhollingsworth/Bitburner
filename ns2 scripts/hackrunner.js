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
    let filename = ns.getScriptName().split('.')[0],
        timestamp = Date().split(' ')[4];
    filename = filename_mod + 'log_csv_' + filename + '.txt';
    data.unshift(timestamp);
    data = data.join(', ');
    await ns.write(filename, data);
    await ns.write(filename, '\r\n');
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

export function build_targets_object(ns, hosts) {
    let output_object = {};
    hosts = hosts.filter(
        (host) => ns.getServerMoneyAvailable(host) > 1 && host != 'home'
    );
    for (let host of hosts) {
        output_object[host] = [0, 0, 0];
    }
    return output_object;
}

export function find_hosts(ns, ignored_hosts = false) {
    let hosts = run_scan(ns, 'home', 5); // build an array of directly and indirectly connected hosts
    hosts.push('home');
    if (ignored_hosts) {
        hosts = hosts.filter((host) => !ignored_hosts.includes(host)); //filter unwanted hosts
    }
    return hosts;
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

export async function run_script(ns, target, script, threads, debug) {
    let servers = find_hosts(ns),
        reserved_ram = 10;
    script += '.js';
    let required_ram = ns.getScriptRam(script) * threads;
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
    for (let server of servers) {
        if (!check_and_get_access(ns, server)) {
            continue;
        }
        let free_ram = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
        if (server == 'host') {
            free_ram -= reserved_ram;
        }
        if (free_ram < required_ram) {
            continue;
        }
        // deploy script to server
        // if (!ns.fileExists(script, server)) {
        await debug_log(ns, ['scp script', script, 'to', server], debug);
        await ns.scp(script, 'home', server);
        // }
        if (!check_and_get_access(ns, target)) {
            continue;
        }
        if (!ns.exec(script, server, threads, target)) {
            ns.tprint(script, ' Failed to run on ', target);
        } // run the script

        return;
    }
    await csv_log(
        ns,
        ['--------- unable to find server with enough ram ---------'],
        debug
    );
    return;
}

export async function main(ns) {
    // var hosts = ns.scan(ns.getHostname()); // build an array of directly connected hosts
    // ns.tail();
    let ignored_hosts = ['CSEC'],
        security_threshold = 0,
        money_threshold = 80,
        script = '',
        threads = 0,
        security_delta_predict = 0,
        money_percent_predict = 0,
        available_ram = 0,
        debug = true,
        log_details = [],
        hosts = find_hosts(ns, ignored_hosts);

    //print out headers
    await csv_log(ns, ['--------------------------------------------'], debug);
    await csv_log(ns, ['------------ Script starting up-------------'], debug);
    await csv_log(ns, ['--------------------------------------------'], debug);
    await csv_log(
        ns,
        [
            'target',
            'script',
            'threads',
            'current',
            'security_delta',
            'money_percent',
        ],
        debug
    );
    let targets = build_targets_object(ns, hosts);

    while (true) {
        hosts = find_hosts(ns, ignored_hosts);
        await debug_log(ns, ['hosts: ', ...hosts], debug);
        for (let target in targets) {
            // loop over each target
            await ns.sleep(500);
            let [security_delta, money_percent] = get_target_info(ns, target);

            // if security is too high and no active weaken tasks
            if (security_delta > 0) {
                if (targets[target][0] == 0) {
                    let weakens_required = calc_weaken_amount(ns, target);
                    log_details = [
                        target,
                        'weaken',
                        weakens_required,
                        targets[target],
                        security_delta,
                        money_percent,
                    ];
                    await csv_log(ns, log_details, debug);
                    await run_script(
                        ns,
                        target,
                        'weaken',
                        weakens_required,
                        debug
                    );
                    targets[target] = [weakens_required, 0, 0];
                } else {
                    await debug_log(
                        ns,
                        [
                            target,
                            'security too high:',
                            security_delta,
                            'weaken already being run',
                            targets[target],
                        ],
                        debug
                    );
                }
            } else if (money_percent < 100) {
                if (targets[target][1] == 0) {
                    //if money too low and now active grows running
                    let grows_required = calc_growth_amount(ns, target);
                    log_details = [
                        target,
                        'grow',
                        grows_required,
                        targets[target],
                        security_delta,
                        money_percent,
                    ];
                    await csv_log(ns, log_details, debug);
                    await run_script(ns, target, 'grow', grows_required);
                    targets[target] = [0, grows_required, 0];
                } else {
                    await debug_log(
                        ns,
                        [
                            target,
                            'money too low:',
                            money_percent,
                            'grow already being run',
                            targets[target],
                        ],
                        debug
                    );
                }
            } else {
                if (targets[target][2] == 0) {
                    let hacks_required = calc_hack_amount(ns, target, 90);
                    log_details = [
                        target,
                        'hack',
                        hacks_required,
                        targets[target],
                        security_delta,
                        money_percent,
                    ];
                    await csv_log(ns, log_details, debug);
                    await run_script(ns, target, 'hack', hacks_required);
                    targets[target] = [0, 0, hacks_required];
                } else {
                    await debug_log(
                        ns,
                        [target, 'hack already being run', targets[target]],
                        debug
                    );
                }
            }
        }
    }
}
