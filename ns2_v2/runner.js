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

export async function ensure_server_clean(ns, host, target) {
    let moneyThresh = ns.getServerMaxMoney(target) * 0.99,
    securityThresh = ns.getServerMinSecurityLevel(target),
    pid_result = 0,
    thread_delta = 0,
    required_jobs = {weaken:0, grow:0},
    active_jobs = structuredClone(required_jobs),
    script_names = {weaken:'target_weaken.js', grow:'target_grow.js'}

    while (true) {
        await ns.sleep(2000)
        let sec_level = ns.getServerSecurityLevel(target),
            // free_ram = ns.getServerMaxRam(host) - ns.getServerUsedRam(host),
            money_available = ns.getServerMoneyAvailable(target)

        if ( sec_level > securityThresh) {
            required_jobs.weaken = calc_weaken_amount(ns,target)
            // ns.print(`security level high:${sec_level}, should be below:${securityThresh}`)
        } else {
            required_jobs.weaken = 0
        }
        if (money_available < moneyThresh) {
            required_jobs.grow = calc_growth_amount(ns,target)
        } else {
            required_jobs.grow = 0
        }
        ns.print(required_jobs,active_jobs)
        for (let [type, required_threads] of Object.entries(required_jobs)){
            thread_delta = required_threads - active_jobs[type]
            if (thread_delta > 0){
                ns.print(type,required_jobs[type],' ',active_jobs[type],' ',thread_delta)
                pid_result = ns.exec(script_names[type],host,thread_delta,target)
                ns.print(`running:${type}, threads:${thread_delta} pid:${pid_result}`)
                ns.print(active_jobs[type])
                active_jobs[type] += thread_delta
                ns.print(active_jobs[type])
            }
        }
        if (required_jobs.weaken,required_jobs.grow + required_jobs.weaken < 1){
            // no required jobs remaining
            ns.print(`${host} is at max money and minimum security level`)
            return
        }
        // if (!Object.values(required_jobs).every) ns.print('server is clean')
    }

    // if (money_available < moneyThresh) {
    //     threads_required = calc_growth_amount(ns,target)
    //     script_name = 'target_grow.js'
    //     required_jobs['grow'] = calc_growth_amount(ns,target)
    //     ns.print(`money level low:${money_available}, should be above:${moneyThresh}`)
    // } else {
    //     return
    // }
    // pid_result = ns.exec(script_name,host,threads_required,target)
}



export async function main(ns) {
    ns.disableLog('ALL')
    const   target = "n00dles",
            host = 'home'
    let     threads_required = 0,
            threads_possible = 0,
            threads_final = 0,
            pid_result = 0,
            script_ram_usage = ''
            ns.exec('target_hack.js',host,1,target)
    await ensure_server_clean(ns,host,target)
    while(true) {
        await ns.sleep(2000)
        // script_ram_usage = ns.getScriptRam(script_name)
        // threads_possible = Math.floor(free_ram / script_ram_usage)
        // ns.print('threads_possible, threads_required, script_name')
        // ns.print(threads_possible,'-',threads_required,'-',script_name)
        // if (threads_required > threads_possible) threads_final = threads_possible;
        // else threads_final = threads_required;
        // if (threads_final){}
    }
}