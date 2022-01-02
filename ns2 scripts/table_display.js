/** @param {NS} ns **/

function calc_max_column_size(ns, data, column_min, columns_spacing) {
    //calcs the longest length of each row, returning into a list - [4,6,1]
    let current = '',
        current_length = 0,
        columns_max = [];

    for (let column in data[0]) {
        columns_max[column] = 0;
        for (let row in data) {
            current = data[row][column];
            current_length = current.toString().length;
            if (current_length > columns_max[column]) {
                columns_max[column] = current_length;
            }
            if (columns_max[column] < column_min) {
                columns_max[column] = column_min;
            }
        }
        columns_max[column] += columns_spacing;
    }
    return columns_max;
}

export function table_dynamic(ns, data, column_min = 5, type = 'string') {
    // input a 2d list and it will print a table with dynamically scaling column widths
    let columns_max = [],
        columns_spacing = 2,
        current = '',
        current_length = 0,
        string = '',
        pad = 0,
        length = 0;

    columns_max = calc_max_column_size(ns, data, column_min, columns_spacing);
    ns.tprintf('INFO - object table display, column widths : ' + columns_max);

    for (let row in data) {
        for (let column in data[0]) {
            current = data[row][column];
            current_length = current.toString().length;
            pad = columns_max[column] - current_length;
            pad = Array(pad + 1).join(' '); // build
            string = string.concat(current); // add data
            string = string.concat(pad); // add trailing spaces
        }
        ns.tprint(string);
        string = '';
    }
    // ns.tprint(string); //print line
}

export function table(ns, data, column = 20) {
    // input a list of items ready to be printed to a line
    let string = '',
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
    test_data = [
        [1, 2, 5],
        [2, 5, 12],
        [13, 444444444445, 123],
    ];
    // ns.tprint(test_data);
    table_dynamic(ns, test_data);
}
