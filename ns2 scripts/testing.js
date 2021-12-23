export function testing(ns, input) {
    let test = 1 + input;
    ns.tprint(test);
    return test;
}
export async function main(ns) {
    let result = testing(ns, 1);
    ns.tprint(result);
}
