/** @param {NS} ns **/
import { get_server_info } from 'server_info.js';
export async function main(ns) {
    let target = ns.args[0],
        log_file = 'monitor_' + target + '.txt',
        action = '',
        time = '',
        server_info = {},
        current_details = [],
        previous_details = [];

    if (!target) {
        target = 'n00dles';
    }

    while (true) {
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
                ns.tprint(
                    Date().split(' ')[4],
                    ' ',
                    target,
                    ' ',
                    action,
                    '  tDelta ',
                    time,
                    '   ',
                    current_details[0],
                    ' ',
                    current_details[1]
                );
            }
            time = new Date() / 1000;
        }
        await ns.sleep(50);
    }

    ns.tprint(current_details);
}
