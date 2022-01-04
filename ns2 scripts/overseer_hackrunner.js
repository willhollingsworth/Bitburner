/** @param {NS} ns **/

import { check_and_get_access, build_hosts_list } from 'hackrunner.js';

export async function main(ns) {
    let hosts = build_hosts_list(ns, '', 6),
        ram_used = 0,
        ram_free = 0,
        ram_total = 0,
        script_ram_usage = 0,
        iteration = 0,
        iteration_limit = 999999;

    // ns.tail();
    for (let host of hosts) {
        ram_used += Math.ceil(ns.getServerUsedRam(host));
        ram_total += ns.getServerMaxRam(host);
        if (ns.args[0] == 'kill' && host != 'home') {
            ns.killall(host);
        }
    }
    if (ns.args[0] == 'kill') {
        ns.exit();
    }
    ram_free = ram_total - ram_used;
    let delay = 100 * hosts.length;
    ns.tprint(
        'ram used : ',
        ram_used,
        ' free : ',
        ram_free,
        ' total : ',
        ram_total,
        ' - ',
        (ram_used / ram_total).toFixed(2),
        ' % across ',
        hosts.length,
        ' devices'
    );

    if (ns.args[0] == 'info') {
        ns.exit();
    }
    ns.exec('hackrunner.js', 'home', 1);
    await ns.sleep(delay);
    script_ram_usage = ram_used;

    while (iteration_limit > iteration) {
        if (script_ram_usage > ram_free) {
            break;
        }
        ns.exec('hackrunner.js', 'home', 1, iteration);
        iteration += 1;
        ram_free -= script_ram_usage;
    }
    await ns.sleep(1000);
    ns.tprint(
        'ram used : ',
        ram_used,
        ' free : ',
        ram_free,
        ' total : ',
        ram_total,
        ' - ',
        (ram_used / ram_total).toFixed(2),
        ' % across ',
        hosts.length,
        ' devices'
    );

    // grab all useable machines
    // run a single hack runner
    // check total usage on usable machines
    // lunch another instance if it's low
    // buy a new server every x mins
}
