/** @param {NS} ns **/
// https://bitburner.readthedocs.io/en/latest/netscript/netscripthacknetnodeapi.html
// unable to work on until you unlock it ingame

export function main(ns) {
    ns.tprint('getHacknetMultipliers', ns.getHacknetMultipliers());
    ns.tprint('getNodeStats', ns.hacknet.getNodeStats());
    ns.tprint('numNodes()', ns.hacknet.numNodes());
}
