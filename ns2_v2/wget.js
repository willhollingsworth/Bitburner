/** @param {NS} ns */
export async function main(ns) {
    let url = 'http://127.0.0.1:7000/',
        script = ns.args[0]
    await ns.wget(url + script, script+'.js', 'home')
}