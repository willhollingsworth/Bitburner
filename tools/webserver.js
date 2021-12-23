var http = require('http');
var fs = require('fs');
var path = require('path');
/*
simple webserver to allow downloading of files into bitburner without the need for copy paste
https://www.tutorialsteacher.com/nodejs/create-nodejs-web-server

*/
https: var port = 7000;
//set script folder
const script_folder = path.join(__dirname, '..', 'ns2 scripts');

//read folder contents, strip file extension
var scripts = fs.readdirSync(script_folder).map((i) => {
    return i.split('.')[0];
});

function read_file(file) {
    //read the given file and return the data
    const filepath = path.join(script_folder, file);
    return fs.readFileSync(filepath, 'utf8', (err, data) => {
        if (err) throw err;
        // console.log(data);
        return data;
    });
}

var server = http.createServer(function (request, response) {
    req = request.url.replace('/', '');
    if (scripts.includes(req)) {
        // if requested file is available locally, server it
        response.writeHead(200, { 'Content-Type': 'text/plain' });
        response.end(read_file(req + '.js'));
        console.log(req, 'downloaded');
    } else {
        // if file isn't found return 404
        response.writeHead(404, { 'Content-Type': 'text/plain' });
        response.end(req + ' not found');
        console.log(req, 'not found');
    }
});
console.log('server started on http://127.0.0.1:' + port);
console.log('files found :', scripts.join(', '));
server.listen(port);
