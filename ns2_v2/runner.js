/** @param {NS} ns */

import { run_scan } from 'depthscanner.js';
import {
    calc_weaken_amount,
    calc_growth_amount,
    calc_hack_amount,
} from 'server_info.js';
import {
    check_and_get_access,
    get_target_info,
    write_csv,
    get_total_ram_usage,
} from 'shared_functions.js';

import { table } from 'table_display.js';

export async function main(ns) {
    ns.disableLog('ALL')
    const   target = "n00dles",
            host = 'home',
            moneyThresh = ns.getServerMaxMoney(target) * 0.75,
            securityThresh = ns.getServerMinSecurityLevel(target) + 1

    let     script_name = '',
            threads_required = 0,
            threads_possible = 0,
            threads_final = 0,
            pid_result = 0,
            script_ram_usage = ''
    while(true) {
        await ns.sleep(1000)
        let     sec_level = ns.getServerSecurityLevel(target),
                free_ram = ns.getServerMaxRam(host) - ns.getServerUsedRam(host),
                money_available = ns.getServerMoneyAvailable(target)
        if ( sec_level > securityThresh) {
            threads_required = calc_weaken_amount(ns,target)
            script_name = 'target_weaken.js'
        } else if (money_available < moneyThresh) {
            threads_required = calc_growth_amount(ns,target)
            script_name = 'target_grow.js'
        } else {
            threads_required = calc_hack_amount(ns,target)
            script_name = 'target_hack.js'
        }
        script_ram_usage = ns.getScriptRam(script_name)
        threads_possible = Math.floor(free_ram / script_ram_usage)
        ns.print('threads_possible, threads_required, script_name')
        ns.print(threads_possible,'-',threads_required,'-',script_name)
        if (threads_required > threads_possible) threads_final = threads_possible;
        else threads_final = threads_required;
        if (threads_final){
            pid_result = ns.exec(script_name,host,threads_final,target)
            if (script_name == 'target_weaken.js') ns.print(`security level high:${sec_level}, should be below:${securityThresh}`);
            else if (script_name == 'target_grow.js') ns.print(`money level low:${money_available}, should be above:${moneyThresh}`);
            else ns.print(`hacking`);
            ns.print(`running:${script_name}, threads:${threads_final} pid:${pid_result}`)
        }
    }
}