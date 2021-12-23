/** @param {NS} ns **/
export async function main(ns) {
    // https://bitburner.readthedocs.io/en/latest/netscript/netscriptjs.html
    ns.print('Starting script here');
    await ns.hack('foodnstuff'); //Use Netscript hack function
    ns.print(ns.args); //The script arguments must be prefaced with ns as well
}
