/** @param {NS} ns **/
export async function main(ns) {
    let url =
            'https://raw.githubusercontent.com/willhollingsworth/Bitburner/dev/ns2%20scripts/scanner.js',
        filename = scanner.json;
    ns.wget(url, filename);
    ns.exec(filename);
}
