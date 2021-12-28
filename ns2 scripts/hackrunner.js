/** @param {NS} ns **/
import { run_scan } from 'depthscanner.js';

export async function log_to_file(ns, data, enabled) {
    if (!enabled) {
        return;
    }
    let filename = ns.getScriptName().split('.')[0];
    filename = 'log_' + filename + '.txt';
    await ns.write(filename, data);
    await ns.write(filename, '\r\n');
}

export function check_and_get_access(ns, target) {
    let num_ports_req = ns.getServerNumPortsRequired(target);
    let num_ports_avail = 0;
    if (target == 'home') {
        return true;
    }
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

export function select_best_target(ns, hosts) {
    return 'phantasy';
}

export async function main(ns) {
    // var hosts = ns.scan(ns.getHostname()); // build an array of directly connected hosts
    var hosts = run_scan(ns, 'home', 3), // build an array of directly and indirectly connected hosts
        ignored_hosts = ['CSEC'],
        security_threshold = 0,
        money_threshold = 80,
        script = '',
        threads = 0,
        security_delta = 0,
        money_percent = 0,
        available_ram = 0,
        log = true;

    hosts = hosts.filter((host) => !ignored_hosts.includes(host));

    // if (!ns.args[0]) {
    //     log = false;
    // } else if (ns.args[0] == 'log') {
    //     log = true;
    // }

    if (ns.args[0] == 'log') {
        log = true;
    } else if (ns.args[0] == 'kill') {
        // if kill argument then shut down all active programs via a kill all
        var k = true;
    }
    hosts.push('home');
    if (log) {
        ns.rm(ns.getScriptName().split('.')[0], 'home');
    }

    while (true) {
        let target = select_best_target(ns, hosts);
        security_delta = (
            ns.getServerSecurityLevel(target) -
            ns.getServerMinSecurityLevel(target)
        ).toPrecision(2);
        for (let host of hosts) {
            // loop over each host
            await ns.sleep(500);
            if (!check_and_get_access(ns, host)) {
                continue;
            }
            money_percent = (
                (ns.getServerMoneyAvailable(target) /
                    ns.getServerMaxMoney(target)) *
                1000
            ).toPrecision(3);
            available_ram =
                ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
            threads = Math.floor(available_ram / 1.8); //initial thread estimate
            if (k) {
                continue; // kill command sent, don't run other processes
            }
            //select the appropriate script
            if (
                security_delta > security_threshold &&
                threads * 0.05 < security_delta
            ) {
                script = 'weaken.script';
                security_delta -= threads * 0.05;
            } else if (money_percent < money_threshold) {
                script = 'grow.script';
            } else {
                script = 'hack.script';
            }

            // determine the number of times the script can be run
            threads = Math.floor(available_ram / ns.getScriptRam(script, host));

            // leave ram free on home
            if (host == 'home') {
                threads = Math.floor(
                    (available_ram - 10) / ns.getScriptRam(script, host)
                );
            }

            // deploy script to server
            if (!ns.fileExists(script, host)) {
                await ns.scp(script, 'home', host);
            }
            // execute script
            if (threads > 0) {
                await log_to_file(
                    ns,
                    `${host}        ${
                        script.split('.')[0]
                    } $:${money_percent}% Sec:${security_delta} T:${threads}`,
                    log
                );

                ns.exec(script, host, threads, target); // run the script}
            }
        }
    }
}
