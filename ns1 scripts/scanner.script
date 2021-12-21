var hosts = scan(getHostname()); // build an array of directly connected hosts
var hack_chance = 0;
var hack_secs = 0;
var hack_amount = 0;
var money_percent = 0;
var hack_money_per_sec = 0;
for (i = 0; i < hosts.length; ++i) {
    // loop over each host
    target = hosts[i];
    hack_chance = Math.round(hackAnalyzeChance(target) * 100);
    hack_secs = Math.round(getHackTime(target) / 1000);
    hack_amount = Math.round(
        hackAnalyze(target) * getServerMoneyAvailable(target)
    );
    money_percent = Math.round(
        (getServerMoneyAvailable(target) / getServerMaxMoney(target)) * 100
    );
    hack_money_per_sec = Math.round(
        (hack_amount / hack_secs) * (hack_chance / 100)
    );
    tprint(
        target,
        ' : ',
        hack_chance,
        '% success - ',
        hack_secs,
        ' secs - $',
        hack_amount,
        ' total gained - $',
        hack_money_per_sec,
        ' per sec - ',
        money_percent,
        '% remaining'
    );
}
