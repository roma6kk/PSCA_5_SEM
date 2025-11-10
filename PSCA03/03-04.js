var http = require('http');
var url = require('url');
var fs = require('fs');

var fact = (k)=>{return k === 0 ? 1 : k * fact(k-1);}

function Fact(k, cb) {
    this.k = k;
    this.ffact = fact;
    this.fcb = cb;
    this.calc = () => {
        process.nextTick(() => {this.fcb(null, this.ffact(this.k));});
    };
}

http.createServer(function(request, response) {
    const parsedUrl = url.parse(request.url, true);

    if (parsedUrl.pathname === '/html') {
        let html = fs.readFileSync('./03-03.html');
        response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
        response.end(html);
    }
    else if (parsedUrl.pathname === '/fact') {
        let kStr = parsedUrl.query.k;
        if (typeof kStr !== 'undefined') {
            let k = parseInt(kStr);
            if (Number.isInteger(k) && k >= 0) {
                let factObj = new Fact(k, (err, result) => {
                    if (err) {
                        response.writeHead(500, {'Content-Type': 'application/json; charset=utf-8'});
                        response.end(JSON.stringify({ error: 'Internal server error' }));
                    } else {
                        response.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
                        response.end(JSON.stringify({ k: k, fact: result }));
                    }
                });
                factObj.calc();
                return;
            }
        }
        response.writeHead(400, {'Content-Type': 'application/json; charset=utf-8'});
        response.end(JSON.stringify({ error: 'Invalid or missing parameter k' }));
    }
    else {
        response.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'});
        response.end('Page not found');
    }
}).listen(3000);

console.log('Server running at http://localhost:3000/html');