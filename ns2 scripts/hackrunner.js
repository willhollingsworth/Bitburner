/** @param {NS} ns **/
import { run_scan } from 'depthscanner.js';

export function check_and_get_access(ns, target) {
    let num_ports_req = ns.getServerNumPortsRequired(target);
    let num_ports_avail = 0;
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
    return 'sigma-cosmetics';
}

export async function main(ns) {
    // var hosts = ns.scan(ns.getHostname()); // build an array of directly connected hosts
    var hosts = run_scan(ns, 'home', 3), // build an array of directly and indirectly connected hosts
        ignored_hosts = ['CSEC'],
        security_threshold = 0,
        money_threshold = 4,
        script = '',
        threads = 0,
        security_delta = 0,
        money_percent = 0,
        log = false;

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
    } else if (ns.args[0] == 'self') {
        hosts.push('home');
    }

    while (true) {
        await ns.sleep(2000);
        let target = select_best_target(ns, hosts);

        for (let host of hosts) {
            // loop over each host
            await ns.sleep(100);
            if (!check_and_get_access(ns, host)) {
                continue;
            }

            money_percent = (
                (ns.getServerMoneyAvailable(target) /
                    ns.getServerMaxMoney(target)) *
                100
            ).toPrecision(3);
            security_delta = (
                ns.getServerSecurityLevel(target) -
                ns.getServerMinSecurityLevel(target)
            ).toPrecision(2);

            if (k) {
                continue; // kill command sent, don't run other processes
            }
            // ns.tprint(`${host}security delta is ${security_delta}`);
            //select the appropriate script
            if (security_delta > security_threshold) {
                if (log) {
                    // ns.tprint(
                    //     `${host} : security level not low enough ${security_delta} - running weaken`
                    // );
                }
                script = 'weaken.script';
            } else if (money_percent < money_threshold) {
                if (log) {
                    // ns.tprint(
                    //     `${host} : money too low ${money_percent}  - running grow`
                    // );
                }
                script = 'grow.script';
            } else {
                if (log) {
                    // ns.tprint(`${host} - running hacking`);
                }
                script = 'hack.script';
            }

            // determine the number of times the script can be run
            threads = Math.floor(
                (ns.getServerMaxRam(host) - ns.getServerUsedRam(host)) /
                    ns.getScriptRam(script, host)
            );

            if (script == 'weaken.script') {
                if (threads * 0.05 > security_delta) {
                    ns.tprint(host, ' would over weaken, running hack instead');
                    script = 'hack.script';
                }
            }

            // deploy script to server
            if (!ns.fileExists(script, host)) {
                await ns.scp(script, 'home', host);
            }

            // execute script
            if (threads > 0) {
                if (log) {
                    ns.tprint(
                        `${host} run ${script} targeting ${target}, Money:${money_percent}%, Security:${security_delta}, Threads:${threads}`
                    );
                }
                ns.exec(script, host, threads, target); // run the script}
            }
        }
    }
}
