/** @param {NS} ns **/
export async function main(ns) {
    // https://bitburner.readthedocs.io/en/latest/netscript/netscriptjs.html

    var return_new_neighbors = (hosts) => {
        var output = [];
        for (let target of hosts) {
            // loop over direct connected hosts
            var new_hosts = ns.scan(target); // find each targets neighbors
            new_hosts = new_hosts.filter((i) => {
                //filter out already tracked items
                return !hosts.includes(i) && i != 'home';
            });
            ns.tprint(target, "'s new neighbors are : ", new_hosts);
            new_hosts.forEach((i) => outpnut.push(i)); // add new hosts to output list
        }
        return output;
    };

    ns.tprint('initial scan results', return_new_neighbors(ns.scan('home')));
    // ns.tprint(scan_hosts(new_targets));
    // ns.tprint(hosts);
}
