/** @param {NS} ns **/
import { run_scan } from 'depthscanner.js';
import {
    calc_weaken_amount,
    calc_growth_amount,
    calc_hack_amount,
} from 'server_info.js';

export async function log_to_file(ns, data) {
    let filename = ns.getScriptName().split('.')[0];
    filename = 'log_csv_' + filename + '.txt';
    data = data.join(', ');
    await ns.write(filename, data);
    await ns.write(filename, '\r\n');
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

export function find_hosts(ns, ignored_hosts) {
    let hosts = run_scan(ns, 'home', 3); // build an array of directly and indirectly connected hosts
    hosts = hosts.filter((host) => !ignored_hosts.includes(host)); //filter unwanted hosts
    hosts.push('home');
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

export function run_script(ns, target, script, threads) {
    let servers = ns.getPurchasedServers();
    script += '.script';
    let required_ram = ns.getScriptRam(script) * threads;
    // if (!check_and_get_access(ns, target)) {
    //     continue;
    // }
    // available_ram =
    //     ns.getServerMaxRam(host) - ns.getServerUsedRam(host);

    for (let server of servers) {
        let free_ram = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
        if (free_ram < required_ram) {
            continue;
        }
        // deploy script to server
        // if (!ns.fileExists(script, server)) {
        //     await ns.scp(script, 'home', server);
        // }
        ns.exec(script, server, threads, target); // run the script}
    }

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
        log = true,
        hosts = find_hosts(ns, ignored_hosts);
    if (ns.args[0] == 'log') {
        log = true;
    } else if (ns.args[0] == 'kill') {
        // if kill argument then shut down all active programs via a kill all
        var k = true;
    }
    if (log) {
        ns.rm(ns.getScriptName().split('.')[0], 'home');
    }

    //print out headers
    await log_to_file(ns, [
        'host',
        'script',
        'money_percent',
        'security_delta',
        'threads',
    ]);
    let targets = build_targets_object(ns, hosts);

    while (true) {
        hosts = find_hosts(ns, ignored_hosts);
        // ns.tprint(targets);
        for (let target in targets) {
            // loop over each host
            await ns.sleep(500);
            let [security_delta, money_percent] = get_target_info(ns, target);
            // ns.tprint(target, ' - ', security_delta, ' - ', money_percent);

            // if security is too high and no active weaken tasks
            if (security_delta > 0) {
                if (targets[target][0] == 0) {
                    let weakens_required = calc_weaken_amount(ns, target);
                    ns.tprint(
                        target,
                        ' needs ',
                        weakens_required,
                        ' weakens, currently running ',
                        targets[target]
                    );
                    run_script(ns, target, 'weaken', weakens_required);
                    targets[target] = [weakens_required, 0, 0];
                }
            } else if (money_percent < 100) {
                if (targets[target][1] == 0) {
                    //if money too low and now active grows running
                    let grows_required = calc_growth_amount(ns, target);
                    ns.tprint(
                        target,
                        ' needs ',
                        grows_required,
                        ' grows, currently running ',
                        targets[target]
                    );
                    run_script(ns, target, 'grow', grows_required);
                    targets[target] = [0, grows_required, 0];
                }
            } else {
                if (targets[target][2] == 0) {
                    let hacks_required = calc_hack_amount(ns, target, 50);
                    ns.tprint(
                        target,
                        ' needs ',
                        hacks_required,
                        ' hacks, currently running ',
                        targets[target]
                    );
                    run_script(ns, target, 'hack', hacks_required);
                    targets[target] = [0, 0, hacks_required];
                }
            }

            // // determine the number of times the script can be run
            // threads = Math.floor(available_ram / ns.getScriptRam(script, host));

            // // leave ram free on home
            // if (host == 'home') {
            //     threads = Math.floor(
            //         (available_ram - 10) / ns.getScriptRam(script, host)
            //     );
            // }
        }
    }
}
