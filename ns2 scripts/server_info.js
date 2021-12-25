/** @param {NS} ns **/
import { run_scan } from 'depthscanner.js';

export function table(ns, data) {
    // input a list of items ready to be printed to a line
    let column = 18;
    let string = '',
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
            Math.round(ns.getServerSecurityLevel(target)) +
                ' / ' +
                Math.round(ns.getServerMinSecurityLevel(target)),
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
            Math.round(
                (ns.getServerMoneyAvailable(target) /
                    ns.getServerMaxMoney(target)) *
                    100
            ),
        ],
        hack_money_per_sec: [
            'Hack $/s',
            Math.round(
                ((ns.hackAnalyze(target) * ns.getServerMoneyAvailable(target)) /
                    (ns.getHackTime(target) / 1000)) *
                    ns.hackAnalyzeChance(target)
            ),
        ],
    };
    if (type == 'all') {
        return server_info;
    } else {
        let output = {};
        if (type == 'standard') {
            types = ['security', 'hack_money_per_sec'];
        }
        // ns.tprint('test');
        for (let x of types) {
            // Object.assign(output, test_obj);
            // output.x = server_info['x'][0];
            // ns.tprint(server_info['x']);
            // ns.tprint(x, '  ', server_info['x']);
        }
        output = server_info;
        return output;
        // (type == 'standard') return server_info['security'];
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
    let depth = 0;
    let type = '';
    if (!ns.args[0]) {
        depth = 2;
    } else {
        depth = ns.args[0];
    }
    if (!ns.args[1]) {
        type = 'standard';
    } else {
        type = ns.args[1];
    }
    // ns.tprint('running scan with a depth of ', depth);
    let hosts = run_scan(ns, 'home', depth); // build an array of directly connected host
    build_headers(ns, type);
    scan_hosts(ns, hosts, type);
}
