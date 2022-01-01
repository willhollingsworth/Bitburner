/** @param {NS} ns **/
import { run_scan } from 'depthscanner.js';
import {
    calc_weaken_amount,
    calc_growth_amount,
    calc_hack_amount,
} from 'server_info.js';

export async function csv_log(ns, data, debug) {
    await write_csv(ns, data);
    if (debug) {
        await write_csv(ns, data, 'debug_');
    }
}

export async function debug_log(ns, data, debug) {
    if (debug) {
        await write_csv(ns, data, 'debug_');
    }
}

export async function write_csv(ns, data, filename_mod = '') {
    let output = data,
        filename = ns.getScriptName().split('.')[0],
        timestamp = Date().split(' ')[4];
    filename = filename_mod + 'log_csv_' + filename + '.txt';
    output.unshift(timestamp);
    output = output.join(', ');
    await ns.write(filename, output + '\r\n');
    return;
}

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

export async function run_script(ns, target, script, threads, hosts, debug) {
    let reserved_ram = 10,
        attempts = 16;
    script += '.js';
    if (threads < 1 || isNaN(threads)) {
        ns.tprint(
            'run script function fed NaN, target:',
            target,
            ' , script: ',
            script,
            ' , threads: ',
            threads
        );
        return;
    }
    while (attempts > 1) {
        let required_ram = ns.getScriptRam(script) * threads;
        for (let server of hosts) {
            if (!check_and_get_access(ns, server)) {
                continue;
            }
            let free_ram =
                ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
            if (server == 'host') {
                free_ram -= reserved_ram;
            }
            if (free_ram < required_ram) {
                continue;
            }
            // deploy script to server
            if (!ns.fileExists(script, server)) {
                // await debug_log(ns, ['scp script', script, 'to', server], debug);
                await ns.scp(script, 'home', server);
            }
            if (!check_and_get_access(ns, target)) {
                continue;
            }
            ns.exec(script, server, threads, target);
            return threads;
        }
        attempts -= 1;
        threads = Math.floor(threads / 2);
    }
    await csv_log(
        ns,
        [target, 'unable to run', script, threads, attempts],
        debug
    );
    ns.tprint('failed to run -> ', script, 'x', threads, ' -> ', target);
    return;
}

export async function write_headers(ns, debug) {
    //print out headers
    await csv_log(
        ns,
        [
            'target',
            'script',
            'threads',
            'active_weakens',
            'active_grows',
            'active_hacks',
            'security_delta',
            'money_percent',
        ],
        debug
    );
}

export class Runner {
    options = {
        //ignored settings
        ignored_hosts: [],
        ignored_targets: ['CSEC'],
        //manual setting
        host_selection: [],
        target_selection: [],
        //tweaking varibles
        hack_drain_amount: 90, //amount to drain when running a hack operation
        depth: 5, //depth of scanning
        debug: false,
    };
    hosts = [];
    targets = [];
    current_target = '';
    completed_actions = {};
    log_details = [];

    constructor(ns) {
        this.ns = ns;
    }

    debug_printer(...data) {
        this.ns.tprint(...data);
        if (this.debug) {
        }
    }
    build_hosts_list() {
        let hosts = [],
            log_string = [],
            host_selection = this.options.host_selection,
            ignored_hosts = this.options.ignored_hosts,
            depth = this.options.depth;

        if (host_selection.length > 0) {
            hosts = host_selection;
            log_string[0] = 'manual host mode on, ';
        } else {
            log_string[0] = '';
            hosts = run_scan(this.ns, 'home', depth);
            // this.build_hosts_list();
        }
        hosts.push('home');
        if (ignored_hosts) {
            hosts = hosts.filter((host) => !ignored_hosts.includes(host)); //filter unwanted hosts
        }
        hosts = hosts.filter(
            (host) =>
                check_and_get_access(this.ns, host) &&
                this.ns.getServerMaxRam(host) > 0
        );
        this.debug_printer('hosts list built : ', hosts);
        this.hosts = hosts;
    }
    build_targets_object() {
        let targets = [],
            targets_object = {},
            target_selection = this.options.target_selection,
            ignored_targets = this.options.ignored_host,
            depth = this.options.depth;

        if (target_selection.length > 0) {
            targets = target_selection;
        } else {
            targets = run_scan(this.ns, 'home', depth);
        }
        if (ignored_targets) {
            targets = targets.filter(
                (target) => !ignored_targets.includes(target)
            ); //filter unwanted hosts
        }
        targets = targets.filter(
            (target) =>
                this.ns.getServerMoneyAvailable(target) > 1 &&
                target != 'home' &&
                this.ns.getServerRequiredHackingLevel(target) <
                    this.ns.getHackingLevel()
        );
        for (let target of targets) {
            targets_object[target] = [0, 0, 0];
        }
        this.debug_printer('targets object built : ', targets_object);
        this.targets = targets_object;
    }
    async process_all_targets() {
        let targets = this.targets;
        while (true) {
            for (let target in targets) {
                this.current_target = target;
                await this.process_current_target();
            }
            await this.ns.sleep(2000);
        }
    }
    async process_current_target() {
        await this.ns.sleep(50);
        let threads = 0,
            current_threads = 0,
            launch_threads = 0,
            targets = this.targets,
            target = this.current_target,
            hosts = this.hosts,
            debug = this.options.debug,
            [security_delta, money_percent] = get_target_info(this.ns, target),
            log_details = [
                target,
                'action',
                'requirement',
                targets[target],
                security_delta,
                money_percent,
            ];

        // if security is too high
        if (security_delta > 0) {
            // if no active weaken tasks
            let weakens_required = calc_weaken_amount(this.ns, target);
            current_threads = targets[target][0];
            if (current_threads < weakens_required) {
                launch_threads = weakens_required - current_threads;
                threads = await run_script(
                    this.ns,
                    target,
                    'weaken',
                    launch_threads,
                    hosts,
                    debug
                );
                log_details[1] = 'run weaken';
                log_details[2] = threads;
                targets[target] = [current_threads + threads, 0, 0];
                log_details[3] = targets[target];
                await csv_log(this.ns, log_details, debug);
                this.debug_printer(log_details);
            } else {
                log_details[1] = "can't run weaken";
                log_details[2] = 'weakens already running';
                await debug_log(this.ns, log_details, debug);
                this.debug_printer(log_details);
            }
        } else if (money_percent < 100) {
            let grows_required = calc_growth_amount(this.ns, target);
            current_threads = targets[target][1];
            if (current_threads < grows_required) {
                launch_threads = grows_required - current_threads;
                threads = await run_script(
                    this.ns,
                    target,
                    'grow',
                    launch_threads,
                    hosts,
                    debug
                );
                log_details[1] = 'run grow';
                log_details[2] = threads;
                targets[target] = [0, current_threads + threads, 0];
                log_details[3] = targets[target];
                await csv_log(this.ns, log_details, debug);
                this.debug_printer(log_details);
            } else {
                log_details[1] = "can't run grow";
                log_details[2] = 'grow already running';
                await debug_log(this.ns, log_details, debug);
                this.debug_printer(log_details);
            }
        } else {
            let hacks_required = calc_hack_amount(
                this.ns,
                target,
                this.options.hack_drain_amount
            );
            current_threads = targets[target][2];
            if (current_threads < hacks_required) {
                launch_threads = hacks_required - current_threads;
                threads = await run_script(
                    this.ns,
                    target,
                    'hack',
                    hacks_required,
                    hosts,
                    debug
                );

                log_details[1] = 'run hack';
                log_details[2] = threads;
                targets[target] = [0, 0, current_threads + threads];
                log_details[3] = targets[target];
                await csv_log(this.ns, log_details, debug);
                this.debug_printer(log_details);
            } else {
                log_details[1] = "can't run hack";
                log_details[2] = 'hacks already running';
                await debug_log(this.ns, log_details, debug);
                this.debug_printer(log_details);
            }
        }
    }
}
export async function main(ns) {
    // await write_headers(ns, debug);
    const runner = new Runner(ns);
    runner.build_hosts_list();
    runner.build_targets_object();
    await runner.process_all_targets();
}
