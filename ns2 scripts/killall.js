/** @param {NS} ns **/
import { Runner } from 'hackrunner.js';

function build_active_scripts_list(ns, host) {
    let scripts = [],
        server_details = ns.ps(host);
    if (server_details == []) {
        return;
    }
    for (let script of server_details) {
        scripts.push([script.filename, ...script.args]);
    }
    return scripts;
}

function kill_scripts(ns, host, scripts) {
    let log = [];
    if (scripts == undefined) {
        return;
    }
    for (let script of scripts) {
        let script_args = [script[0], host, ...script.slice(1)];
        // ns.tprint(script_args);
        if (script == ns.getScriptName()) {
            continue;
        }
        ns.kill(...script_args);
        log.push(script[0] + ' ');
    }
    ns.tprint(host, ' killed ', ...log);
}

export async function main(ns) {
    ns.tprint('script starting');
    const runner = new Runner(ns);
    for (let host of runner.hosts) {
        let scripts = build_active_scripts_list(ns, host);
        kill_scripts(ns, host, scripts);
    }
}
