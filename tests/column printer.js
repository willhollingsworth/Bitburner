var column = 20;

var headers = () => {
    table(['red', 'blue', 'green']);
};

var table = (a) => {
    var string = '',
        pad = 0,
        length = 0,
        spaces = '';
    for (let x of a) {
        length = x.length;
        pad = column - length;
        spaces = Array(pad + 1).join(' ');
        string = string.concat(x);
        string = string.concat(spaces);
    }
    console.log(string);
};
headers();
