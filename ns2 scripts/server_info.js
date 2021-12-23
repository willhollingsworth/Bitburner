/** @param {NS} ns **/

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

export function get_server_info(ns, target) {
    // returns an object containing the targets info
    // objects format is key : string_name, computed result
    // ns.tprint('getting info from ', target);
    let server_info = {
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
                    ns.getHackTime(target) /
                    1000) *
                    ns.hackAnalyzeChance(target)
            ),
        ],
    };
    return server_info;
}

export function build_headers(ns) {
    // build out the initial headers of the table using appropriate field
    let headers = ['Target'];
    for (let head of Object.values(get_server_info(ns, 'n00dles'))) {
        headers.push(head[0]);
    }
    table(ns, headers);
}

export function scan_host(ns, hosts) {
    for (let target of hosts) {
        // loop over each host
        let host_data = get_server_info(ns, target); // grab their info
        let output_data = [];
        for (let x of Object.values(host_data)) {
            // split the needed info into a list
            output_data.push(x[1]);
        }
        table(ns, [target, ...output_data]); // print the info
    }
}

export function main(ns) {
    let hosts = ns.scan(ns.getHostname()); // build an array of directly connected host
    build_headers(ns);
    scan_host(ns, hosts);
}
