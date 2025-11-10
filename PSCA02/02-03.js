var http = require('http');

http.createServer(function(request, response)
{

    if(request.url === '/api/name')
    {
            response.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8'});
            response.end('Ананьев Роман Васильевич');
    }
    
    else {
        response.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'});
        response.end('page not found');
    }
}).listen(3000);

console.log('Server running at http://localhost:3000/')