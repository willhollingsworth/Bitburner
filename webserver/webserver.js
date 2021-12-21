var http = require('http');
var fs = require('fs');
var path = require('path');
/*
simple webserver to allow downloading of files into bitburner without the need for copy paste
https://www.tutorialsteacher.com/nodejs/create-nodejs-web-server
*/
https: var port = 7000;

function read_file(file) {
    const filepath = path.join(__dirname, '..', 'ns2 scripts', file);
    return fs.readFileSync(filepath, 'utf8', (err, data) => {
        if (err) throw err;
        // console.log(data);
        return data;
    });
}

https: var server = http.createServer(function (request, response) {
    if (request.url == '/') {
        response.writeHead(200, { 'Content-Type': 'text/plain' });
        response.end('root');
    } else if (request.url == '/scanner') {
        response.writeHead(200, { 'Content-Type': 'text/plain' });
        console.log('severed scanner');
        response.end(read_file('scanner.js'));
    } else if (request.url == '/updater') {
        response.writeHead(200, { 'Content-Type': 'text/plain' });
        console.log('severed updater');
        response.end(read_file('updater.js'));
    }
});
console.log('server started on http://127.0.0.1:' + port);
server.listen(port);
