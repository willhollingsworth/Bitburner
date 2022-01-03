/** @param {NS} ns **/

export async function main(ns) {
    // initially download all scripts
    let scripts = [
            'depthscanner',
            'server_info',
            'target_grow',
            'target_hack',
            'target_weaken',
            'worker_hwg',
            'updater',
            'table_display',
            'purchase_server',
            'delay_weaken',
            'delay_grow',
            'delay_hack',
        ],
        url = 'http://127.0.0.1:7000/';

    for (let script of scripts) {
        if (await ns.wget(url + script, script + '.js', 'home')) {
            ns.tprint(script, ' downloaded');
        } else {
            ns.tprintf('Error ' + script + ' failed to download');
        }
    }
}
