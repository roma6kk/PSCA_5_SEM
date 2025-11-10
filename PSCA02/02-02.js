var http = require('http');
var fs = require('fs');

http.createServer(function(request, response)
{
    const fname = './pic.png';
    let png = null;
    if(request.url === '/png')
    {
    fs.stat(fname, (err, stat) => {
        if(err){console.log('error:', err);}
        else {
            png = fs.readFileSync(fname);
            response.writeHead(200, {'Content-Type': 'image/png', 'Content-Length':stat.size});
            response.end(png, 'binary');
        }
    })
    }
    else {
        response.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'});
        response.end('page not found');
    }
}).listen(3000);

console.log('Server running at http://localhost:3000/')