/** @param {NS} ns **/
import { run_scan } from 'depthscanner.js';
import {
    calc_weaken_amount,
    calc_growth_amount,
    calc_hack_amount,
} from 'server_info.js';
import { table } from 'table_display.js';

function disable_unneeded_logging(ns) {
    ns.disableLog('getServerMinSecurityLevel');
    ns.disableLog('getServerSecurityLevel');
    ns.disableLog('getServerMoneyAvailable');
    ns.disableLog('getServerMaxMoney');
    ns.disableLog('getServerRequiredHackingLevel');
    ns.disableLog('sleep');
    ns.disableLog('getServerMaxRam');
    ns.disableLog('getServerUsedRam');
    ns.disableLog('getHackingLevel');
    ns.disableLog('exec');
}

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

    debug_printer(...data) {
        this.ns.print(...data);
        if (this.options.debug) {
            this.ns.tprint(...data);
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
        this.debug_printer(
            'hosts list built, length : ',
            Object.keys(hosts).length,
            ' - ',
            hosts
        );
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
                    [0, 0, 0],
                    [0, 0],
                    // threads [weaken,grow,hack]
                    // sec to run [total, longest of weaken and grow,]
                ];
            }
        }
        this.debug_printer(
            'targets object built, length : ',
            Object.keys(targets_object).length,
            ' - ',
            targets_object
        );
        return targets_object;
    }

    async process_all_targets() {
        let targets = this.targets;
        await write_csv(
            this.ns,
            ['target', 'threads W/G/H', 'delays full/middle'],
            'completed_'
        );
        while (true) {
            for (let target in targets) {
                this.current_target = target;
                await this.process_current_target();
                await this.ns.sleep(50);
            }
            await this.ns.sleep(500);
        }
    }

    async process_current_target() {
        let target = this.current_target,
            [security_delta, money_percent] = get_target_info(this.ns, target);

        if (security_delta > 0) {
            await this.do_action('weaken');
        }
        if (money_percent < 100) {
            await this.do_action('grow');
        }
        if (money_percent > 99 && security_delta < 0.05) {
            await this.do_action('hack');
        }
    }

    async do_action(action) {
        let targets = this.targets,
            target = this.current_target,
            required_threads = 0,
            current_threads = 0,
            launch_threads = 0,
            result_threads = 0,
            list_position = 0,
            log_details = [target, 'action', 0, targets[target]];

        if (action == 'weaken') {
            required_threads = calc_weaken_amount(this.ns, target);
            list_position = 0;
        } else if (action == 'grow') {
            required_threads = calc_growth_amount(this.ns, target);
            list_position = 1;
        } else if (action == 'hack') {
            required_threads = calc_hack_amount(this.ns, target);
            list_position = 2;
        }
        current_threads = targets[target][list_position];
        //if additional jobs required
        if (current_threads < required_threads) {
            // run script
            launch_threads = required_threads - current_threads;
            result_threads = await this.run_script(action, launch_threads);
            if (!result_threads) {
                return;
            }
            this.debug_printer(
                target,
                ' ran ',
                action,
                ' ',
                result_threads,
                ' ',
                targets[target]
            );
            // update active jobs
            targets[target][list_position] = current_threads + result_threads;
            this.targets = targets;
            // update current threads
            current_threads = current_threads + result_threads;
            // if all threads have run
            if (current_threads >= required_threads) {
                if (action == 'hack') {
                    // if hack active then grow and weaken complete, update active jobs
                    targets[target] = [0, 0, targets[target][2]];
                } else {
                    // else reset hacking active jobs counter
                    targets[target][2] = 0;
                }
                //log
                log_details[1] = 'run ' + action;
                log_details[2] = current_threads;
                await csv_log(this.ns, log_details);

                //write completed actions
                if (
                    action == 'weaken' ||
                    this.completed_actions[target][0][0]
                ) {
                    // only start block at weaken, don't start on any other action
                    let timestamp_first = this.completed_actions[target][1][0],
                        time_delta = Math.ceil(
                            new Date() / 1000 - timestamp_first
                        ),
                        hack_threads = this.completed_actions[target][0][2],
                        first_action =
                            targets[target][0] != 0 && targets[target][1] == 0;

                    // if first action of cycle
                    if (first_action) {
                        if (timestamp_first) {
                            //if not first run of cycle
                            this.completed_actions[target][1][0] = time_delta;
                            this.debug_printer(
                                Date().split(' ')[4],
                                ' ',
                                target,
                                ' cycle complete ',
                                this.completed_actions[target]
                            );
                            await write_csv(
                                this.ns,
                                [target, ...this.completed_actions[target]],
                                'completed_'
                            );
                            this.completed_actions[target] = [
                                [0, 0, 0],
                                [0, 0],
                            ];
                        }
                        this.completed_actions[target][1][0] = Math.ceil(
                            new Date() / 1000
                        );
                    }
                    //write total threads to completed actions
                    this.completed_actions[target][0][list_position] +=
                        current_threads;
                    //if grow and weaken have run, record the time it took
                    if (action == 'hack' && timestamp_first) {
                        this.completed_actions[target][1][1] = time_delta;
                    }
                }
            }
        }
    }

    async run_script(script, threads) {
        let reserved_ram = 10,
            attempts = 16,
            target = this.current_target,
            hosts = this.hosts,
            random_hash = threads + '_' + Math.floor(Math.random() * 1000);

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
                if (
                    !this.ns.exec(script, server, threads, target, random_hash)
                ) {
                    this.ns.tprint(
                        'ERROR ' +
                            script +
                            ' failed ' +
                            server +
                            ' ' +
                            threads +
                            ' ' +
                            target
                    );
                    return false;
                } else {
                    return threads;
                }
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
    disable_unneeded_logging(ns);
    const runner = new Runner(ns);
    await runner.process_all_targets();
}
