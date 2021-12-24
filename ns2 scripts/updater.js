/** @param {NS} ns **/
export async function main(ns) {
    let url = 'http://127.0.0.1:7000/';
    await ns.wget(url + ns.args[0], ns.args[0] + '.js', 'home');
    if (ns.getScriptName() == ns.args[0] + '.js') {
        ns.tprint('self updating detected, will not run exec command');
        ns.exit();
    }
    await ns.sleep(500);
    if (!ns.args[1]) {
        ns.args[1] = '';
    }
    await ns.exec(ns.args[0] + '.js', 'home', 1, ns.args[1]);
}
