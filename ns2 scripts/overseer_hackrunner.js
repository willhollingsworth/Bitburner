/** @param {NS} ns **/

import { check_and_get_access, Runner } from 'hackrunner.js';
import { check_and_get_access } from 'shared_functions.js';

export class Overseer {
    ram_used = 0;
    ram_free = 0;
    ram_total = 0;
    runner = {};
    hosts = [];
    script_ram_usage = 0;
    iteration = 0;
    iteration_limit = 999999;
    constructor(ns) {
        this.ns = ns;
        this.runner = new Runner(ns);
        this.hosts = this.runner.hosts;
        this.get_server_info();
    }

    get_server_info() {
        for (let host of this.hosts) {
            this.ram_used += Math.ceil(this.ns.getServerUsedRam(host));
            this.ram_total += this.ns.getServerMaxRam(host);
            if (this.ns.args[0] == 'kill' && host != 'home') {
                this.ns.killall(host);
            }
        }
        this.ram_free = this.ram_total - this.ram_used;
    }

    print_status() {
        this.ns.tprint(
            ' Ram usage ',
            ((this.ram_used / this.ram_total) * 100).toFixed(2),
            ' % across ',
            this.hosts.length,
            ' devices ',
            'ram used : ',
            this.ram_used,
            ' free : ',
            this.ram_free,
            ' total : ',
            this.ram_total
        );
    }
    async launch_runners() {
        let iteration = 0,
            iteration_limit = 6;

        while (iteration_limit > iteration) {
            if (script_ram_usage > ram_free) {
                break;
            }
            ns.exec('hackrunner.js', 'home', 1, iteration);
            iteration += 1;
            ram_free -= script_ram_usage;
        }
    }
}

export async function main(ns) {
    const overseer = new Overseer(ns);
    overseer.print_status();
}
// let delay = 100 * hosts.length;

// if (ns.args[0] == 'info') {
//     ns.exit();
// }
// ns.exec('hackrunner.js', 'home', 1);
// await ns.sleep(delay);

// while (iteration_limit > iteration) {
//     if (script_ram_usage > ram_free) {
//         break;
// script_ram_usage = ram_used;
// }
// ns.exec('hackrunner.js', 'home', 1, iteration);
//     iteration += 1;
//     ram_free -= script_ram_usage;
// }
// await ns.sleep(1000);

// grab all useable machines
// run a single hack runner
// check total usage on usable machines
// lunch another instance if it's low
// buy a new server every x mins
