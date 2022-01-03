/** @param {NS} ns **/
import { run_scan } from 'depthscanner.js';
import {
    calc_weaken_amount,
    calc_growth_amount,
    calc_hack_amount,
} from 'server_info.js';
import { table } from 'table_display.js';

export async function csv_log(ns, data, debug = false) {
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
    let output = '',
        filename = ns.getScriptName().split('.')[0],
        timestamp = Date().split(' ')[4];
    filename = filename_mod + 'log_csv_' + filename + '.txt';
    // output.unshift(timestamp);
    output = [timestamp].concat(data);
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
        //tweaking variables
        hack_drain_amount: 90, //amount to drain when running a hack operation
        depth: 5, //depth of scanning
        debug: false,
    };
    hosts = [];
    targets = {};
    completed_actions = {};
    current_target = '';
    log_details = [];

    constructor(ns) {
        this.ns = ns;
        this.build_hosts_list();
        this.targets = this.build_targets_object('targets');
        this.completed_actions = this.build_targets_object('completed');
    }

    debug_printer(data) {
        if (this.options.debug) {
            table(this.ns, data, 30);
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
    build_targets_object(type = 'targets') {
        let targets = [],
            targets_object = {},
            target_selection = this.options.target_selection,
            ignored_targets = this.options.ignored_hosts,
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
        if (type == 'targets') {
            for (let target of targets) {
                targets_object[target] = [0, 0, 0];
            }
        } else if (type == 'completed') {
            for (let target of targets) {
                targets_object[target] = [
                    [0, 0],
                    [0, 0],
                    [0, 0],
                    [0, 0],
                ];
            }
        }
        this.debug_printer('targets object built : ', targets_object);
        return targets_object;
    }
    async process_all_targets() {
        let targets = this.targets;
        while (true) {
            for (let target in targets) {
                this.current_target = target;
                await this.process_current_target();
            }
            await this.ns.sleep(500);
        }
    }

    async process_current_target() {
        await this.ns.sleep(50);
        let threads = 0,
            required_threads = 0,
            current_threads = 0,
            launch_threads = 0,
            result_threads = 0,
            list_position = 0,
            action = '',
            targets = this.targets,
            target = this.current_target,
            [security_delta, money_percent] = get_target_info(this.ns, target),
            log_details = [target, 'action', 0, targets[target]];

        if (security_delta > 0) {
            action = 'weaken';
            required_threads = calc_weaken_amount(this.ns, target);
            list_position = 0;
        } else if (money_percent < 100) {
            action = 'grow';
            required_threads = calc_growth_amount(this.ns, target);
            list_position = 1;
        } else {
            action = 'hack';
            required_threads = calc_hack_amount(this.ns, target);
            list_position = 2;
        }
        current_threads = targets[target][list_position];
        if (current_threads < required_threads) {
            // run script
            launch_threads = required_threads - current_threads;
            result_threads = await this.run_script(action, launch_threads);

            //update target object
            targets[target] = [0, 0, 0];
            targets[target][list_position] = current_threads + result_threads;
            current_threads = current_threads + result_threads;
            this.targets = targets;

            // if all threads have run
            if (current_threads >= required_threads) {
                //log
                log_details[1] = 'run ' + action;
                log_details[2] = current_threads;
                await csv_log(this.ns, log_details);

                //write completed actions
                let actions0 = this.completed_actions[target][0][0],
                    actions1 = this.completed_actions[target][1][0],
                    actions2 = this.completed_actions[target][2][0],
                    actions3 = this.completed_actions[target][3][0],
                    completed_position = 0,
                    timestamp = Math.ceil(
                        new Date() / 1000 - this.completed_actions[target][0][1]
                    );

                //reorder completed positions so it's hack, weaken, grow, weaken
                if (list_position == 2) {
                    completed_position = 0;
                }
                if (list_position == 0 && !actions1) {
                    completed_position = 1;
                } else if (list_position == 1) {
                    completed_position = 2;
                } else if (list_position == 0 && actions1) {
                    completed_position = 3;
                }

                //subtract previous timestamp from current one to ensure theres a delta
                if (actions0 || completed_position == 0) {
                    //write to completed actions object
                    this.completed_actions[target][completed_position][0] =
                        current_threads;
                    this.completed_actions[target][completed_position][1] =
                        timestamp;

                    actions3 = this.completed_actions[target][3][0];

                    // this.ns.tprint(
                    //     Date().split(' ')[4],
                    //     ' ',
                    //     action,
                    //     '  ',
                    //     this.completed_actions
                    // );
                }
                if (completed_position == 0 && actions3) {
                    // if already completed a loop
                    let t0 = this.completed_actions[target][0][1],
                        t1 = this.completed_actions[target][1][1],
                        t2 = this.completed_actions[target][2][1],
                        t3 = this.completed_actions[target][3][1];

                    t0 = t1;
                    t1 = t2 - t1;
                    t2 = t3 - t2;
                    t3 = timestamp - t3;

                    this.completed_actions[target][0][1] = t0;
                    this.completed_actions[target][1][1] = t1;
                    this.completed_actions[target][2][1] = t2;
                    this.completed_actions[target][3][1] = t3;
                    await write_csv(
                        this.ns,
                        [target, ...this.completed_actions[target], timestamp],
                        'completed_'
                    );
                    // this.ns.tprint(
                    //     Date().split(' ')[4],
                    //     ' completed ' +
                    //         target +
                    //         ' in ' +
                    //         timestamp +
                    //         ' seconds - H: ' +
                    //         actions0 +
                    //         ' W: ' +
                    //         actions1 +
                    //         ' G: ' +
                    //         actions2 +
                    //         ' W: ' +
                    //         actions3
                    // );
                    this.completed_actions[target] = [
                        [current_threads, Math.ceil(new Date() / 1000)],
                        [0, 0],
                        [0, 0],
                        [0, 0],
                    ];
                }
            }
        }
    }

    async run_script(script, threads) {
        let reserved_ram = 10,
            attempts = 16,
            target = this.current_target,
            hosts = this.hosts;

        script = 'target_' + script + '.js';
        if (threads < 1 || isNaN(threads)) {
            this.ns.tprintf(
                'ERROR - run script - bad thread count' +
                    target +
                    script +
                    threads
            );
            return;
        }
        while (attempts > 1) {
            let required_ram = this.ns.getScriptRam(script) * threads;
            for (let server of hosts) {
                if (!check_and_get_access(this.ns, server)) {
                    continue;
                }
                let free_ram =
                    this.ns.getServerMaxRam(server) -
                    this.ns.getServerUsedRam(server);
                if (server == 'host') {
                    free_ram -= reserved_ram;
                }
                if (free_ram < required_ram) {
                    continue;
                }
                // deploy script to server
                if (!this.ns.fileExists(script, server)) {
                    // await debug_log(ns, ['scp script', script, 'to', server], debug);
                    await this.ns.scp(script, 'home', server);
                }
                this.ns.exec(script, server, threads, target);
                return threads;
            }
            attempts -= 1;
            threads = Math.floor(threads / 2);
        }
        await csv_log(this.ns, [
            target,
            'unable to run',
            script,
            threads,
            attempts,
        ]);
        this.ns.tprintf(
            'ERROR' +
                'run script failed to pass checks' +
                target +
                script +
                threads
        );
        return;
    }
}

export async function main(ns) {
    // await write_headers(ns, debug);
    const runner = new Runner(ns);
    await runner.process_all_targets();
}
