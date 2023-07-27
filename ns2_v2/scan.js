/** @param {NS} ns */
export async function main(ns) {
    const   target = "n00dles"

    ns.tprint(target)
    ns.tprint(`Server Max Money: ${ns.getServerMaxMoney(target)}, Current Money: ${ns.getServerMoneyAvailable(target)}`)
    ns.tprint(`Min Sec Level: ${ns.getServerMinSecurityLevel(target)}, Current Level: ${ns.getServerSecurityLevel(target).toFixed(3)}`)
    ns.tprint(`Money stolen % of hack: ${ns.hackAnalyze(target).toFixed(5)}, Success Chance: ${ns.hackAnalyzeChance(target).toFixed(3)}, Sec increase: ${ns.hackAnalyzeSecurity(1, target)}`)
}