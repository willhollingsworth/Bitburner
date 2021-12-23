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
    // https://bitburner.readthedocs.io/en/latest/netscript/netscriptjs.html

    // ns.tprint(run_scan());
    // ns.tprint(run_scan('zer0'));
    // ns.tprint(run_scan(ns, ns.args[0], ns.args[1]));
    ns.tprint(run_scan(ns));
    // ns.tprint(scan_hosts(new_targets));
    // ns.tprint(hosts);
}
