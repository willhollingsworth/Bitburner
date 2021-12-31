/** @param {NS} ns **/

export function return_new_neighbors(ns, hosts) {
    var output = [];
    for (let target of hosts) {
        // loop over direct connected hosts
        var new_hosts = ns.scan(target); // find each targets neighbors
        new_hosts = new_hosts.filter((i) => {
            //filter out already tracked items
            return !hosts.includes(i) && i != 'home';
        });
        // ns.tprint(target, "'s new neighbors are : ", new_hosts);
        new_hosts.forEach((i) => output.push(i)); // add new hosts to output list
    }
    return output;
}

export function run_scan(ns, host = 'home', depth = 1) {
    var hosts = ns.scan(host);
    for (var i of [...Array(depth - 1).keys()]) {
        // ns.tprint('loop ', i, ', hosts ', hosts);
        hosts = return_new_neighbors(ns, hosts).concat(hosts);
    }

    // ns.tprint('scan run from ' + host + ', d:' + depth + ', result: ' + hosts);
    return hosts;
}

export async function main(ns) {
    let depth = 2,
        args = ns.args[0],
        scan_results = 0;

    if (args) {
        depth = args;
    }

    scan_results = run_scan(ns, 'home', depth);
    ns.tprint('scan ran with depth : ', depth);
    ns.tprint('results : ', scan_results.length);
    ns.tprint(scan_results);

    // ns.tprint(scan_hosts(new_targets));
    // ns.tprint(hosts);
}
