var http = require('http');
var url = require('url');
var fs = require('fs')
var fact = (k)=>{return k === 0 ? 1 : k * fact(k-1);}

http.createServer(function(request, response) {
    if(url.parse(request.url).pathname === '/html')
    {
    let html = fs.readFileSync('./03-03.html');
    response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    response.end(html);
    }
    else if(url.parse(request.url).pathname === '/fact'){
        if(typeof(url.parse(request.url, true).query.k != 'undefined'))
        {
            let k = parseInt(url.parse(request.url, true).query.k);
            if(Number.isInteger(k)){
                response.writeHead(200, {'content-type': 'application/json; charset=utf-8'});
                response.end(JSON.stringify({k:k, fact: fact(k)}));
            }
        }
    }
    else{
        response.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'});
        response.end('page not found');
    }
}).listen(3000);
console.log('Server running at http://localhost:3000/html');
