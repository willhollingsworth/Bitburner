/** @param {NS} ns **/

export async function main(ns) {
    let file = ns.args[0],
        current_data = '',
        previous_data = '';
    ns.disableLog('ALL');
    ns.tail();
    if (!file) {
        file = 'actions_log_csv_hackrunner.txt';
    }
    while (true) {
        current_data = ns.read(file);
        if (current_data != previous_data) {
            ns.print(current_data);
        }

        previous_data = current_data;
        await ns.sleep(100);
    }
}
