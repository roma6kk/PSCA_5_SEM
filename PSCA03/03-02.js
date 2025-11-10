var http = require('http');
var url = require('url');

var fact = (k)=>{return k === 0 ? 1 : k * fact(k-1);}

http.createServer(function(request, response) {
    if(url.parse(request.url).pathname === '/fact'){
        if(typeof(url.parse(request.url, true).query.k != 'undefined'))
        {
            let k = parseInt(url.parse(request.url, true).query.k);
            if(Number.isInteger(k)){
                response.writeHead(200, {'content-type': 'application/json; charset=utf-8'});
                response.end(JSON.stringify({k:k, fact: fact(k)}));
            }
        }
    }
}).listen(3000);
console.log('Server running at http://localhost:3000/');
