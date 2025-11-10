const http = require('http');
const fs = require('fs');

const server = http.createServer((request, response) => {
    if (request.url === '/api/name') {
        response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Ананьев Роман Васильевич');
    }
    else if (request.url === '/xmlhttprequest') {
        fs.readFile('xmlhttprequest.html', 'utf8', (err, data) => {
            if (err) {
                response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                response.end('Ошибка при чтении файла xmlhttprequest.html');
                console.error(err);
            } else {
                response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                response.end(data);
            }
        });
    }
    else {
        response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('page not found');
    }
}).listen(3000);

console.log('Server running at http://localhost:3000/')