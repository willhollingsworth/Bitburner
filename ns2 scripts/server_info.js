/** @param {NS} ns **/
import { run_scan } from 'depthscanner.js';
import { table, table_dynamic } from 'table_display.js';

export function calc_growth_amount(ns, target) {
    let money_filled_percent =
            ns.getServerMoneyAvailable(target) / ns.getServerMaxMoney(target),
        multiplier_to_full = Math.ceil(1 / money_filled_percent);

    if (multiplier_to_full > 1 && multiplier_to_full != Infinity) {
        return Math.ceil(ns.growthAnalyze(target, multiplier_to_full));
    } else {
        return NaN;
    }
}
export function calc_weaken_amount(ns, target) {
    let weakens = Math.ceil(
        (ns.getServerSecurityLevel(target) -
            ns.getServerMinSecurityLevel(target)) /
            0.05
    );
    return weakens;
}

export function calc_hack_amount(ns, target, percent_amount) {
    let current = ns.getServerMoneyAvailable(target),
        hack_threads = ns.hackAnalyzeThreads(target, current / 2);
    if (hack_threads == 'Infinity') {
        return NaN;
    } else {
        return Math.ceil(hack_threads);
    }
}

export function get_server_info(ns, target, type = 'all') {
    // returns an object containing the targets info
    // objects format is key : string_name, computed result
    // ns.tprint('getting info from: ', target, ', with type: ', type);
    let types = [];
    let server_info = {
        security: [
            'Sec curr / min',
            ns.getServerSecurityLevel(target).toPrecision(4) +
                ' / ' +
                ns.getServerMinSecurityLevel(target).toPrecision(2),
        ],
        hack_chance: [
            'Hack chance',
            Math.round(ns.hackAnalyzeChance(target) * 100),
        ],
        hack_secs: ['Hack time', Math.round(ns.getHackTime(target) / 1000)],
        hack_amount: [
            'Hack $ gain',
            Math.round(
                ns.hackAnalyze(target) * ns.getServerMoneyAvailable(target)
            ),
        ],
        money_avail: ['$ left', Math.round(ns.getServerMoneyAvailable(target))],
        money_percent: [
            '$% filled',
            Number(
                (ns.getServerMoneyAvailable(target) /
                    ns.getServerMaxMoney(target)) *
                    100
            ).toPrecision(3),
        ],
        hack_money_per_sec: [
            'Hack $/s',
            Math.round(
                ((ns.hackAnalyze(target) * ns.getServerMoneyAvailable(target)) /
                    (ns.getHackTime(target) / 1000)) *
                    ns.hackAnalyzeChance(target)
            ),
        ],
        ram: [
            'Ram used / total',
            ns.getServerUsedRam(target) + ' / ' + ns.getServerMaxRam(target),
        ],
        root: ['Root access', ns.hasRootAccess(target) ? 'Yes' : 'No'],
        ports: ['Ports', ns.getServerNumPortsRequired(target)],
        hack_skill: [
            'Skill required',
            ns.getServerRequiredHackingLevel(target),
        ],
        security_delta: [
            'Security Delta',
            Number(
                ns.getServerSecurityLevel(target) -
                    ns.getServerMinSecurityLevel(target)
            ).toPrecision(3),
        ],
        weakens_required: ['weakens required', calc_weaken_amount(ns, target)],
        growths_required: ['growths required', calc_growth_amount(ns, target)],
        hacks_required: ['hack to 50%', calc_hack_amount(ns, target, 50)],
    };
    if (type == 'all') {
        return server_info;
    } else {
        let output_obj = {};
        types = [];
        if (type == 'standard') {
            types = [
                'root',
                'security',
                'hack_money_per_sec',
                'ram',
                'ports',
                'hack_skill',
            ];
        }
        if (type == 'predict') {
            types = [
                'hack_skill',
                'security_delta',
                'weakens_required',
                'money_percent',
                'growths_required',
                'hacks_required',
            ];
        }

        for (let x of types) {
            let temp_obj = {};
            temp_obj[x] = server_info[x];
            Object.assign(output_obj, temp_obj);
        }
        return output_obj;
    }
}

export function build_headers(ns, type) {
    // build out the initial headers of the table using appropriate field
    let headers = ['Target'],
        server_list = Object.values(get_server_info(ns, 'foodnstuff', type));
    for (let head of server_list) {
        headers.push(head[0]);
    }
    return headers;
}

export function scan_hosts(ns, hosts, type) {
    let hosts_data = [],
        sort_column = 1;
    for (let target of hosts) {
        // loop over each host
        let host_data = get_server_info(ns, target, type), // grab their info
            output_data = [];
        if (type == 'predict') {
            // don't return servers you can't hack
            if (host_data.money_percent[1] == 'NaN' || target == 'home') {
                continue;
            }
            sort_column = 1;
        }
        if (type == 'standard') {
            sort_column = 3;
        }
        for (let x of Object.values(host_data)) {
            // split the needed info into a list
            output_data.push(x[1]);
        }
        hosts_data.push([target, ...output_data]); // amend all host data to the end of the list
        // table(ns, [target, ...output_data]); // print the info
    }

    hosts_data.sort((a, b) => b[sort_column] - a[sort_column]);
    return hosts_data;
}

export function main(ns) {
    //setup args
    let depth = 2,
        type = 'standard',
        hosts_data = [],
        headers = [];
    if (ns.args[0]) {
        depth = ns.args[0];
    }
    if (ns.args[1]) {
        type = ns.args[1];
        ns.tprint('type detected - ', ns.args[1]);
    } else {
        ns.tprint('no types detected');
    }

    // run main logic
    let hosts = run_scan(ns, 'home', depth); // build an array of directly connected host
    headers = build_headers(ns, type);
    hosts_data = scan_hosts(ns, hosts, type);
    table_dynamic(ns, [headers].concat(hosts_data));
}
