import { run_scan } from 'depthscanner.js';

/** @param {NS} ns **/
export async function main(ns) {
    ns.tprint(run_scan(ns, ns.args[0], ns.args[1]));
}
