/** @param {NS} ns **/
import { get_server_info } from 'server_info.js';
import { get_total_ram_usage } from 'shared_functions.js';

export async function main(ns) {
    ns.tail();
    let target = ns.args[1],
        type = ns.args[0],
        log_file = 'monitor_' + target + '.txt',
        action = '',
        time = '',
        server_info = {},
        current_details = [],
        previous_details = [];

    if (!type) {
        type = 'server';
    }
    if (!target) {
        target = 'n00dles';
    }
    ns.disableLog('ALL');
    while (true) {
        if (type == 'ram') {
            let current_details = get_total_ram_usage(ns);
            if (current_details != previous_details) {
                ns.print(
                    Date().split(' ')[4],
                    '  ',
                    ((current_details[0] / current_details[1]) * 100).toFixed(
                        1
                    ),
                    '%',
                    ', used: ',
                    current_details[0]
                );
            }
            previous_details = current_details;
        }

        if (type == 'server') {
            server_info = get_server_info(ns, target, 'all');
            previous_details = current_details;
            current_details = [
                server_info.security_delta[1],
                server_info.money_percent[1],
            ];

            if (
                current_details[0] != previous_details[0] ||
                current_details[1] != previous_details[1]
            ) {
                if (current_details[0] < previous_details[0]) {
                    action = 'weaken';
                } else if (current_details[1] > previous_details[1]) {
                    action = 'hack  ';
                } else if (current_details[1] < previous_details[1]) {
                    action = 'grow  ';
                } else {
                    action = 'unsure';
                }
                if (time != '') {
                    time = (new Date() / 1000 - time).toFixed(1);
                    ns.print(
                        Date().split(' ')[4],
                        ' ',
                        target,
                        ' ',
                        action,
                        ' security: ',
                        Number(current_details[0]).toFixed(3),
                        ' , money: ',
                        Number(current_details[1]).toFixed(1),
                        ' ,  time: ',
                        time
                    );
                }
                time = new Date() / 1000;
            }
        }
        await ns.sleep(500);
    }
}
