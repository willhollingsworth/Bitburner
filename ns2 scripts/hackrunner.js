/** @param {NS} ns **/
import { run_scan } from 'depthscanner.js';

export function check_and_get_access(ns, target) {
    let num_ports_req = ns.getServerNumPortsRequired(target);
    if (!ns.hasRootAccess(target)) {
        if (num_ports_req == 0) {
            ns.nuke(target);
        }
        if (num_ports_req == 1) {
            return false;
        }
    }
    if (ns.hasRootAccess(target)) {
        return true;
    } else {
        return false;
    }
}

export async function main(ns) {
    // var hosts = ns.scan(ns.getHostname()); // build an array of directly connected hosts
    var hosts = run_scan(ns, 'home', 3); // build an array of directly and indirectly connected hosts
    var security_threshold = 0;
    var money_threshold = 75;

    var script = '';
    var threads = 0;
    var security_delta = 0;
    var money_percent = 0;
    var log = false;
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
        for (let target of hosts) {
            // loop over each host
            await ns.sleep(100);
            if (!check_and_get_access(ns, target)) {
                continue;
            }

            money_percent = Math.round(
                (ns.getServerMoneyAvailable(target) /
                    ns.getServerMaxMoney(target)) *
                    100
            );
            security_delta = (
                ns.getServerSecurityLevel(target) -
                ns.getServerMinSecurityLevel(target) +
                0.1
            ).toPrecision(2);

            if (k) {
                continue; // kill command sent, don't run other processes
            }
            // ns.tprint(`${target}security delta is ${security_delta}`);
            //select the appropriate script
            if (security_delta > security_threshold) {
                if (log) {
                    ns.tprint(
                        target,
                        ': security level not low enough ',
                        security_delta
                    );
                }
                script = 'weaken.script';
            } else if (money_percent < money_threshold) {
                if (log) {
                    ns.tprint(
                        target,
                        ' : money remaining too low ',
                        money_percent
                    );
                }
                script = 'grow.script';
            } else {
                script = 'hack.script';
            }

            // determine the number of times the script can be run
            threads = Math.floor(
                (ns.getServerMaxRam(target) - ns.getServerUsedRam(target)) /
                    ns.getScriptRam(script, target)
            );

            // deploy script to server
            if (!ns.fileExists(script, target)) {
                await ns.scp(script, 'home', target);
            }

            // execute script
            if (threads > 0) {
                if (log) {
                    ns.tprint(target, ': run ', script, ' - threads ', threads);
                }
                ns.exec(script, target, threads, target); // run the script}
            }
        }
    }
}
