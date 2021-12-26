export async function main(ns) {
    ns.tprint(ns.ps('home')[0]['filename'].split('.')[0]);
}
