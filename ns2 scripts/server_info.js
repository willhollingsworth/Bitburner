/** @param {NS} ns **/
import { run_scan } from 'depthscanner.js';

export function table(ns, data) {
    // input a list of items ready to be printed to a line
    let column = 18,
        string = '',
        pad = 0,
        length = 0;

    for (let x of data) {
        // loop over each list item
        length = (x + '').length; // convert to string, get length
        pad = column - length;
        pad = Array(pad + 1).join(' '); // build
        string = string.concat(x); // add data
        string = string.concat(pad); // add trailing spaces
    }
    ns.tprint(string); //print line
}

export function get_server_info(ns, target, type = 'all') {
    // returns an object containing the targets info
    // objects format is key : string_name, computed result
    // ns.tprint('getting info from: ', target, ', with type: ', type);
    let types = [];
    let server_info = {
        security: [
            'Sec curr / min',
            ns.getServerSecurityLevel(target).toPrecision(2) +
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
            (
                (ns.getServerMoneyAvailable(target) /
                    ns.getServerMaxMoney(target)) *
                100
            ).toPrecision(4),
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
        root: ['root access', ns.hasRootAccess(target) ? 'Yes' : 'No'],
    };
    if (type == 'all') {
        return server_info;
    } else {
        let temp_list = Object.entries(server_info),
            types = [];
        if (type == 'standard') {
            types = ['security', 'hack_money_per_sec', 'ram'];
        }
        temp_list = temp_list.filter((key) => types.includes(key[0]));
        server_info = Object.fromEntries(temp_list);
        return server_info;
    }
}

export function build_headers(ns, type) {
    // build out the initial headers of the table using appropriate field
    let headers = ['Target'];
    let server_list = Object.values(get_server_info(ns, 'foodnstuff', type));
    for (let head of server_list) {
        headers.push(head[0]);
    }
    table(ns, headers);
}

export function scan_hosts(ns, hosts, type) {
    let hosts_data = [];
    for (let target of hosts) {
        // loop over each host
        let host_data = get_server_info(ns, target, type); // grab their info
        let output_data = [];
        for (let x of Object.values(host_data)) {
            // split the needed info into a list
            output_data.push(x[1]);
        }
        hosts_data.push([target, ...output_data]);
        // table(ns, [target, ...output_data]); // print the info
    }
    hosts_data.sort((a, b) => b[2] - a[2]);
    for (let x of hosts_data) {
        table(ns, x);
    }
}

export function main(ns) {
    let depth = 0,
        type = '';
    if (!ns.args[0]) {
        depth = 2;
    } else {
        depth = ns.args[0];
    }
    if (!ns.args[1]) {
        ns.tprint('no types detected');
        type = 'standard';
    } else {
        type = ns.args[1];
        ns.tprint('type detected - ', ns.args[1]);
    }
    // ns.tprint('running scan with a depth of ', depth);
    let hosts = run_scan(ns, 'home', depth); // build an array of directly connected host
    build_headers(ns, type);
    scan_hosts(ns, hosts, type);
}
