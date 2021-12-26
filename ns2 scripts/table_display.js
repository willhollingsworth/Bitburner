/** @param {NS} ns **/
export function table(ns, data) {
    // input a list of items ready to be printed to a line
    let column = 18,
        string = '',
        pad = 0,
        length = 0;

    for (let x of data) {
        // loop over each list item
        length = (x + '').length; // convert to string, get length
        pad = column - length;
        pad = Array(pad + 1).join(' '); // build
        string = string.concat(x); // add data
        string = string.concat(pad); // add trailing spaces
    }
    ns.tprint(string); //print line
}
export function main(ns) {
    let test_data = [1, 2, 3, 4, 5, 6, 7, 8];
    table(ns, test_data);
}
