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
    let log = [],
        count = 0;
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
        count += 1;
    }
    // ns.tprint(host, ' killed ', ...log);
    return count;
}

export async function main(ns) {
    let count = 0;
    ns.tprint('killing scripts');
    const runner = new Runner(ns);
    for (let host of runner.hosts) {
        let scripts = build_active_scripts_list(ns, host);
        count += kill_scripts(ns, host, scripts);
    }
    ns.tprint('killed ', count, ' scripts');
}
