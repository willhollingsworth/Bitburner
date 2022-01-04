/** @param {NS} ns **/
class Testing {
    constructor(ns, v1, v2) {
        this.ns = ns;
        this.v1 = v1;
    }
    printer(data) {
        this.ns.tprint(data);
    }
    print_now() {
        let v1 = this.v1;
        this.ns.tprint(this.v1);
        this.printer(this.v1);
        v1 = 'bb';
        this.printer(v1);
        this.printer(this.v1);
        this.v1 = v1;
        this.printer(this.v1);
    }
}

export async function main(ns) {
    const testing = new Testing(ns, 'aa');
    testing.print_now();
}
// ns.tail();
// ns.write('filename.txt', 'all this data');
// ns.tprint(ns.ps('home')[0]['filename'].split('.')[0]);
// ns.tprint(ns.getServer('n00dles'));
// ns.tprint(ns.getServerGrowth('n00dles'));
// ns.tprint(Date().split(' ')[4]);
// ns.tprint(ns.weaken('joesguns'));
// await ns.hack(ns.args[0]);
// let server = 'joesguns',
//     script = 'hack.js';
// await ns.scp(script, 'home', server);
// await ns.exec(script, server);
// ns.tprint(ns.getPlayer()['hacking']);
// ns.tprint(ns.getHackingLevel());
