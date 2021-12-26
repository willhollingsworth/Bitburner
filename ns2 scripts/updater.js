/** @param {NS} ns **/
export async function main(ns) {
    let url = 'http://127.0.0.1:7000/';
    if (ns.getScriptName() == ns.args[0] + '.js' || !ns.args[0]) {
        await ns.wget(url + 'updater', 'updater.js', 'home');
        ns.tprint('self updating detected, will not run exec command');
        ns.exit();
    }
    await ns.wget(url + ns.args[0], ns.args[0] + '.js', 'home');
    await ns.sleep(500);
    // if (!ns.args[1]) {
    //     ns.args[1] = '';
    // }
    // if (!ns.args[2]) {
    //     ns.args[2] = '';
    // }

    if (ns.args[1]) {
        if (ns.args[2]) {
            ns.tprint('2 args - ', ns.args[1], ', ', ns.args[2]);
            await ns.exec(
                ns.args[0] + '.js',
                'home',
                1,
                ns.args[1],
                ns.args[2]
            );
            ns.exit();
        }
        ns.tprint('1 args - ', ns.args[1]);
        await ns.exec(ns.args[0] + '.js', 'home', 1, ns.args[1]);
    } else {
        ns.tprint('no args');
        await ns.exec(ns.args[0] + '.js', 'home', 1);
    }
}
