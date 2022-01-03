/** @param {NS} ns **/
export async function main(ns) {
    let url = 'http://127.0.0.1:7000/',
        script = ns.args[0],
        script_js = '';
    ns.tprintf('INFO-------------------------------');
    if (script) {
        if (script.includes('.js')) {
            ns.tprintf(' .js found,fixing');
            script_js = script;
            script = script.split('.')[0];
        } else {
            script_js = script + '.js';
        }
    }

    if (ns.getScriptName() == script_js || !script) {
        await ns.wget(url + 'updater', 'updater.js', 'home');
        ns.tprintf('WARN - self updating detected, will not run exec command');
        ns.exit();
    }
    if (await ns.wget(url + script, script_js, 'home')) {
        ns.tprintf(' ' + script + ' downloaded');
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
    if (ns.isRunning(script_js, 'home')) {
        ns.tprintf('WARNING - old script still running, killing it');
        ns.scriptKill(script_js, 'home');
        await ns.sleep(1000);
    }
    if (ns.args[1]) {
        if (ns.args[2]) {
            ns.tprintf(
                ' running script with 2 args - ' +
                    ns.args[1] +
                    ', ' +
                    ns.args[2]
            );
            await ns.exec(script_js, 'home', 1, ns.args[1], ns.args[2]);
            ns.exit();
        }
        ns.tprintf(' running script with 1 args - ' + ns.args[1]);
        await ns.exec(script_js, 'home', 1, ns.args[1]);
    } else {
        ns.tprintf(' running script with no args');
        await ns.exec(script_js, 'home', 1);
    }
    ns.tprintf('INFO-------------------------------');
}
