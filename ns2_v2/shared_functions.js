/** @param {NS} ns **/
import { run_scan } from 'depthscanner.js';

export function check_and_get_access(ns, target) {
    if (ns.hasRootAccess(target)) {
        return true;
    }
    let num_ports_req = ns.getServerNumPortsRequired(target),
        num_ports_avail = 0;
    if (ns.fileExists('brutessh.exe', 'home')) {
        ns.brutessh(target);
        num_ports_avail += 1;
    }
    if (ns.fileExists('FTPCrack.exe', 'home')) {
        ns.ftpcrack(target);
        num_ports_avail += 1;
    }
    if (ns.fileExists('relaySMTP.exe', 'home')) {
        ns.relaysmtp(target);
        num_ports_avail += 1;
    }
    if (ns.fileExists('HTTPWorm.exe', 'home')) {
        ns.httpworm(target);
        num_ports_avail += 1;
    }
    if (ns.fileExists('SQLInject.exe', 'home')) {
        ns.sqlinject(target);
        num_ports_avail += 1;
    }
    let port_delta = num_ports_avail - num_ports_req;
    if (port_delta >= 0) {
        ns.nuke(target);
        return true;
    } else {
        return false;
    }
}

export function get_target_info(ns, target) {
    let security_delta = (
            ns.getServerSecurityLevel(target) -
            ns.getServerMinSecurityLevel(target)
        ).toFixed(2),
        money_percent = (
            (ns.getServerMoneyAvailable(target) /
                ns.getServerMaxMoney(target)) *
            100
        ).toFixed(2);

    return [security_delta, money_percent];
}

export async function write_csv(ns, data, filename_mod = '') {
    let output = '',
        filename = ns.getScriptName().split('.')[0],
        timestamp = Date().split(' ')[4];
    filename = filename_mod + '_log_csv_' + filename + '.txt';
    // output.unshift(timestamp);
    output = [timestamp].concat(data);
    output = output.join(', ');
    await ns.write(filename, output + '\r\n');
    return;
}

export function get_server_ram_usage(ns, server) {
    let ram_used, ram_total, ram_free;
    ram_used = Math.ceil(ns.getServerUsedRam(server));
    ram_total = ns.getServerMaxRam(server);
    ram_free = ram_total - ram_used;
    return [ram_used, ram_total, ram_free];
}

export function get_total_ram_usage(ns) {
    let hosts = run_scan(ns, 'home', 20);
    let ram_used = 0,
        ram_total = 0,
        ram_free = 0;
    hosts = hosts.filter(
        (host) => check_and_get_access(ns, host) && ns.getServerMaxRam(host) > 0
    );
    for (let host of hosts) {
        let host_ram = get_server_ram_usage(ns, host);
        ram_used += host_ram[0];
        ram_total += host_ram[1];
        ram_free += host_ram[2];
    }
    // ns.tprint('found ', hosts.length, ' hosts', hosts);
    return [ram_used, ram_total, ram_free];
}

export async function main(ns) {
    // ns.tprint(get_server_ram_usage(ns, 'n00dles'));
    ns.tprint('get total ram usage - Used, Total, Free', get_total_ram_usage(ns));
}
