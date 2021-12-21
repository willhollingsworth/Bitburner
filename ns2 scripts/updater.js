/** @param {NS} ns **/
export async function main(ns) {
    let url = 'http://127.0.0.1:7000/';
    await ns.wget(url + ns.args[0], ns.args[0] + '.js', 'home');
    await ns.sleep(500);
    await ns.exec(ns.args[0] + '.js', 'home');
}
