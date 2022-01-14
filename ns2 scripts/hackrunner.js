/** @param {NS} ns **/
import { run_scan } from 'depthscanner.js';
import {
    calc_weaken_amount,
    calc_growth_amount,
    calc_hack_amount,
} from 'server_info.js';
import {
    check_and_get_access,
    get_target_info,
    write_csv,
    get_total_ram_usage,
} from 'shared_functions.js';

import { table } from 'table_display.js';
function disable_unneeded_logging(ns) {
    ns.disableLog('ALL');
}

export async function csv_log(ns, data, debug = false) {
    await write_csv(ns, data);
    if (debug) {
        await write_csv(ns, data, 'debug');
    }
}

export async function debug_log(ns, data, debug) {
    if (debug) {
        await write_csv(ns, data, 'debug');
    }
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
        hack_drain_amount: 98, //amount to drain when running a hack operation
        depth: 20, //depth of scanning
        game_stage_depth_timeout: 0,
        game_stage_training_timeout: 3,
        artificial_training_multiplier: 1,
        debug: false,
        previous_money: 0,
    };
    hosts = [];
    targets = {};
    completed_actions = {};
    current_target = '';
    log_details = [];

    constructor(ns) {
        this.ns = ns;
        this.build_hosts_list();
    }

    debug_printer(...data) {
        this.ns.print(...data);
        if (this.options.debug) {
            this.ns.tprint(...data);
        }
    }

    get_game_stage() {
        let ram_total = get_total_ram_usage(this.ns),
            old_depth = this.options.depth,
            ram_usage = ram_total[0] / ram_total[1];

        this.targets = this.build_targets_object('targets');
        this.completed_actions = this.build_targets_object('completed');
        this.build_hosts_list();
        if (ram_usage < 0.9) {
            if (this.options.game_stage_training_timeout < 1) {
                this.options.artificial_training_multiplier += Math.round(
                    (0.9 - ram_usage) * 20
                );
                this.options.game_stage_training_timeout = 2;
            } else {
                this.options.game_stage_training_timeout -= 1;
            }
        } else {
            this.options.artificial_training_multiplier = Math.max(
                1,

                this.options.artificial_training_multiplier -
                    Math.round(ram_usage * 10)
            );
        }

        this.debug_printer(
            'hosts :',
            this.hosts.length,
            ', targets:',
            Object.keys(this.targets).length,
            ', new training multi :',
            this.options.artificial_training_multiplier.toFixed(1),
            ', game stage changed, D:',
            this.options.depth,
            ', ram usage:',
            ((ram_total[0] / ram_total[1]) * 100).toFixed(1)
        );
    }

    purchase_server() {
        let current_money = this.ns.getServerMoneyAvailable('home');
        if (current_money / 4)
            this.options.previous_money =
                this.ns.getServerMoneyAvailable('home');
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
            hosts = run_scan(this.ns, 'home', 20);
            // this.build_hosts_list();
        }
        if (ignored_hosts) {
            hosts = hosts.filter((host) => !ignored_hosts.includes(host)); //filter unwanted hosts
        }
        hosts = hosts.filter(
            (host) =>
                check_and_get_access(this.ns, host) &&
                this.ns.getServerMaxRam(host) > 0
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
                    this.ns.getHackingLevel() &&
                check_and_get_access(this.ns, target)
        );
        if (type == 'targets') {
            for (let target of targets) {
                if (this.targets.hasOwnProperty(target)) {
                    targets_object[target] = this.targets[target];
                } else {
                    targets_object[target] = [0, 0, 0];
                }
            }
            // targets_object.sort((a, b) => a[1] - b[1])
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
        return targets_object;
    }

    async process_all_targets() {
        await write_csv(
            this.ns,
            ['target', 'threads W/G/H', 'delays full/middle'],
            'completed'
        );
        while (true) {
            for (let target in this.targets) {
                this.current_target = target;
                await this.process_current_target();
                await this.ns.sleep(50);
            }
            await this.ns.sleep(2000);
            this.get_game_stage();
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
            required_threads =
                calc_weaken_amount(this.ns, target) *
                this.options.artificial_training_multiplier;
            list_position = 0;
        } else if (action == 'grow') {
            required_threads =
                calc_growth_amount(this.ns, target) *
                this.options.artificial_training_multiplier;
            list_position = 1;
            if (isNaN(required_threads)) {
                required_threads = 100;
            }
        } else if (action == 'hack') {
            required_threads = calc_hack_amount(
                this.ns,
                target,
                this.options.hack_drain_amount
            );
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
                            await write_csv(
                                this.ns,
                                [target, ...this.completed_actions[target]],
                                'completed'
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
        let reserved_ram = 20,
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
                if (server == 'home') {
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
                if (threads < 1) {
                    continue;
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
        return;
    }
}

export async function main(ns) {
    // await write_headers(ns, debug);
    ns.tail();
    disable_unneeded_logging(ns);
    const runner = new Runner(ns);
    await runner.process_all_targets();
}
