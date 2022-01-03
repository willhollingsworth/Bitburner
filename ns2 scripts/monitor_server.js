/** @param {NS} ns **/
import { get_server_info } from 'server_info.js';
export async function main(ns) {
    let target = 'n00dles',
        log_file = 'monitor_' + target + '.txt',
        server_info = {},
        useful_details = [],
        previous_details = [];

    while (true) {
        server_info = get_server_info(ns, target, 'all');
        previous_details = useful_details;
        useful_details = [
            server_info.security_delta[1],
            server_info.money_percent[1],
        ];

        if (
            useful_details[0] != previous_details[0] ||
            useful_details[1] != previous_details[1]
        ) {
            ns.tprint(target, ' ', useful_details);
        }
        await ns.sleep(100);
    }

    ns.tprint(useful_details);
}
