/** @param {NS} ns **/

export function time_print(ns, msg, previous_time) {
    let current_time = new Date() / 1000,
        time_delta = Math.round(current_time - previous_time);
    ns.tprint(time_delta, '  ', msg);
    return current_time;
}

function calc_offsets(ns, delays) {
    // given a set of delays for actions,
    // calc offsets so they actions are correctly staggered
    //
    let offsets = [0],
        new_val = 0,
        highest = 0,
        current = 0,
        spacing = 2,
        debug = false;
    if (debug) {
        ns.tprint('delays are  ', delays);
    }
    for (let x in delays) {
        current = delays[x];
        if (x == 0) {
            highest = current;
            continue;
        }
        if (current - spacing <= highest) {
            new_val = highest - current + spacing;
        } else {
            new_val = 0;
        }
        offsets.push(new_val);
        highest = Math.max(highest, current + new_val);
    }
    if (debug) {
        ns.tprint('offsets are ', offsets);
    }
    return offsets;
}

export async function main(ns) {
    // worker function to run a set of hack,weaken, grow, weaken
    let target = 'n00dles',
        server = 'home',
        delays = [5, 15, 12, 15],
        offsets = [],
        threads = [106, 5, 10, 1],
        previous_time = new Date() / 1000,
        start_time = '';
    ns.tail();
    offsets = calc_offsets(ns, delays);

    // while (true) {
    start_time = new Date() / 1000;

    if (await ns.exec('delay_hack.js', server, threads[0], target, 0)) {
        // previous_time = time_print(ns, 'hack started', previous_time);
    }
    if (
        await ns.exec('delay_weaken.js', server, threads[1], target, offsets[0])
    ) {
        // previous_time = time_print(ns, 'weaken started', previous_time);
    }
    if (
        await ns.exec('delay_grow.js', server, threads[2], target, offsets[1])
    ) {
        // previous_time = time_print(ns, 'grow started', previous_time);
    }
    if (
        await ns.exec('delay_weaken.js', server, threads[3], target, offsets[2])
    ) {
        // previous_time = time_print(ns, 'weaken started', previous_time);
    }
    await ns.sleep(offsets[2]);
    // await ns.sleep(delays[0] * 1000);
    // previous_time = time_print(ns, 'weaken started', previous_time);
    // await ns.weaken(target, { threads: threads[1] });
    // await ns.sleep(delays[1] * 1000);
    // previous_time = time_print(ns, 'grow started', previous_time);
    // await ns.grow(target, { threads: threads[2] });
    // await ns.sleep(delays[2] * 1000);
    // previous_time = time_print(ns, 'weaken started', previous_time);
    // await ns.weaken(target, { threads: threads[3] });
    // await ns.sleep(delays[3] * 1000);
    // ns.tprint(
    //     'cycle completed in ',
    //     Math.round(new Date() / 1000 - start_time)
    // );
    // }
}
