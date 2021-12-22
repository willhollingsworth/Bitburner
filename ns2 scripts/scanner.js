/** @param {NS} ns **/
export async function main(ns) {
    let hosts = ns.scan(ns.getHostname()); // build an array of directly connected hosts
    let hack_chance = 0,
        hack_secs,
        hack_amount,
        money_avail,
        money_percent,
        hack_money_per_sec;
    let column = 15;
    var headers = () => {
        table([
            'Target',
            'Hack chance',
            'Hack time',
            'Hack $ gain',
            'Hack $/s',
            '$ left',
            '$ filled %',
        ]);
    };

    var table = (a) => {
        // input a list of items ready to be printed to a line
        let string = '',
            pad = 0,
            length = 0;
        for (let x of a) {
            // loop over each list item
            length = (x + '').length; // convert to string, get length
            pad = column - length;
            pad = Array(pad + 1).join(' '); // build
            string = string.concat(x); // add data
            string = string.concat(pad); // add trailing spaces
        }
        ns.tprint(string); //print line
    };
    headers();
    for (let target of hosts) {
        // loop over each host
        hack_chance = Math.round(ns.hackAnalyzeChance(target) * 100);
        hack_secs = Math.round(ns.getHackTime(target) / 1000);
        hack_amount = Math.round(
            ns.hackAnalyze(target) * ns.getServerMoneyAvailable(target)
        );
        money_avail = Math.round(ns.getServerMoneyAvailable(target));
        money_percent = Math.round(
            (money_avail / ns.getServerMaxMoney(target)) * 100
        );
        hack_money_per_sec = Math.round(
            (hack_amount / hack_secs) * (hack_chance / 100)
        );
        table([
            target,
            hack_chance,
            hack_secs,
            hack_amount,
            hack_money_per_sec,
            money_avail,
            money_percent,
        ]);
    }
}
