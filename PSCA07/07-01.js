let http = require('http');
let fs = require('fs');
let stat = require('./m07-01')('./static')
let http_handler = (req, res) => {
    if      (req.method != "GET") stat.writeHTTP405(res);
    else if (stat.isStatic('html', req.url)) stat.sendFile(req, res, {'Content-type': 'text/html; charset=utf-8'});
    else if (stat.isStatic('css', req.url)) stat.sendFile(req,res, {'Content-type': 'text/css;charset=utf-8'});
    else if (stat.isStatic('js', req.url)) stat.sendFile(req,res, {'Content-type': 'text/javascript;charset=utf-8'});
    else if (stat.isStatic('docx', req.url)) stat.sendFile(req,res, {'Content-type': 'application/msword'});
    else if (stat.isStatic('png', req.url)) stat.sendFile(req,res, {'Content-type': 'image/png'});
    else if (stat.isStatic('json', req.url)) stat.sendFile(req,res, {'Content-type': 'application/json'});
    else if (stat.isStatic('xml', req.url)) stat.sendFile(req,res, {'Content-type': 'application/xml'});
    else if (stat.isStatic('mp4', req.url)) stat.sendFile(req,res, {'Content-type': 'video/mp4'});
    else stat.writeHTTP404(res);
}

let server = http.createServer();
server.listen(3000, (v) => {console.log('server.listen(3000)')})
    .on('error', (e) => {console.log('server.listen(3000): error: ', e.code)})
    .on('request', http_handler);
console.log('Server running on http://localhost:3000/')