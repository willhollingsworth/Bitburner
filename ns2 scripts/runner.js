/** @param {NS} ns **/
export async function main(ns) {
    var hosts = ns.scan(ns.getHostname()); // build an array of directly connected hosts
    var success_threshold = 75;
    var money_threshold = 75;

    var script = '';
    var threads = 0;

    var hack_chance = 0;
    var money_percent = 0;
    var log = false;

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
            hack_chance = Math.round(ns.hackAnalyzeChance(target) * 100);
            money_percent = Math.round(
                (ns.getServerMoneyAvailable(target) /
                    ns.getServerMaxMoney(target)) *
                    100
            );
            if (k) {
                continue;
            }
            if (hack_chance < success_threshold) {
                if (log) {
                    ns.print(target, ': hack chance too low ', hack_chance);
                }
                script = 'weaken.script';
            } else if (money_percent < money_threshold) {
                if (log) {
                    ns.print(
                        target,
                        ' : money remaining too low ',
                        money_percent
                    );
                }
                script = 'grow.script';
            } else {
                script = 'hack.script';
            }
            threads = Math.floor(
                // determine the number of times the script can be run
                (ns.getServerMaxRam(target) - ns.getServerUsedRam(target)) /
                    ns.getScriptRam(script, target)
            );
            if (!ns.fileExists(script, target)) {
                ns.scp(script, 'home', target); // deploy script to server
            }
            if (threads > 0) {
                if (log) {
                    ns.print(target, ': run ', script, ' - threads ', threads);
                }
                ns.exec(script, target, threads, target); // run the script}
            }
        }
    }
}
