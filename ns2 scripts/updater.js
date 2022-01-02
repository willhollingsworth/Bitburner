/** @param {NS} ns **/
export async function main(ns) {
    let url = 'http://127.0.0.1:7000/',
        script = ns.args[0];
    if (script) {
        if (script.includes('.js')) {
            ns.tprintf('INFO - js found');
            script = script.split('.')[0];
        }
    }

    if (ns.getScriptName() == script + '.js' || !script) {
        await ns.wget(url + 'updater', 'updater.js', 'home');
        ns.tprintf('WARN - self updating detected, will not run exec command');
        ns.exit();
    }
    if (await ns.wget(url + script, script + '.js', 'home')) {
        ns.tprint(script, ' downloaded');
    } else {
        ns.tprintf('ERROR - ' + script + ' unable to download!');
    }
    await ns.sleep(500);
    // if (!ns.args[1]) {
    //     ns.args[1] = '';
    // }
    // if (!ns.args[2]) {
    //     ns.args[2] = '';
    // }
    ns.scriptKill(script, 'home');
    if (ns.args[1]) {
        if (ns.args[2]) {
            ns.tprint('2 args - ', ns.args[1], ', ', ns.args[2]);
            await ns.exec(script + '.js', 'home', 1, ns.args[1], ns.args[2]);
            ns.exit();
        }
        ns.tprint('1 args - ', ns.args[1]);
        await ns.exec(script + '.js', 'home', 1, ns.args[1]);
    } else {
        ns.tprint('no args');
        await ns.exec(script + '.js', 'home', 1);
    }
}
