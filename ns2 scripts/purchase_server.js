/** @param {NS} ns **/
function show_server_costs(ns, num) {
    for (let i of [...Array(num).keys()]) {
        let ram = 2 ** i;
        let cost = ns.getPurchasedServerCost(ram);
        ns.tprint('ram: ', ram, ', r p/$: ', cost / ram, ', Total $: ', cost);
    }
}

function calc_server_costs(ns, limit) {
    // build a 3d list of server costs,
    // format being [[ram,purchase price],[],]
    let start_list = [...Array(limit).keys()],
        output_list = [];
    for (let i of start_list) {
        let ram = 2 ** i;
        let cost = ns.getPurchasedServerCost(ram);
        output_list.push([ram, cost]);
    }
    return output_list;
}

function buy_best_server(ns, player_money, name) {
    let server_costs = calc_server_costs(ns, 20),
        best_server_ram = 0,
        log = false;

    for (let server of server_costs) {
        if (server[1] > player_money) {
            best_server_ram = server[0] / 2;
            if (log) {
                ns.tprint('ram,server cost, player money', [
                    best_server_ram.toLocaleString(),
                    (server[1] / 2).toLocaleString(),
                    Math.round(player_money).toLocaleString(),
                ]);
            }
            break;
        }
    }
    // ns.tprint(name, '   ', best_server_ram);
    ns.tprint(
        'buying new server - ram:',
        best_server_ram,
        ', name : ',
        name,
        ', status: ',
        ns.purchaseServer(name, best_server_ram)
    );
}
export async function main(ns) {
    // show_server_costs(ns, 6);
    // ns.tail();
    let player_money = ns.getServerMoneyAvailable('home'),
        max_servers = ns.getPurchasedServerLimit(),
        purchased_servers = ns.getPurchasedServers(),
        num_purchased_servers = purchased_servers.length,
        purchases_remaining = max_servers - num_purchased_servers,
        server_name = 'cloud_' + num_purchased_servers;

    // for (let i of [...Array(purchases_remaining).keys()]) {
    //     ns.tprint(i);
    // }
    buy_best_server(ns, player_money, server_name);
}
