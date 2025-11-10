var http = require('http');

http.createServer(function (request, response) {
    response.contentType = 'text/html';
    response.end(state);
}).listen(3000);

console.log('Server running at http://localhost:3000/');
let state = 'norm';
process.stdout.write(`${state}-->`);

process.stdin.setEncoding('utf-8');
process.stdin.on('readable', () => {
    let chunk = null;
    while ((chunk = process.stdin.read()) != null) {
        if (chunk.trim() == 'norm') {
            state = 'norm';
        }
        else if (chunk.trim() == 'stop') {
            state = 'stop';
        }
        else if (chunk.trim() == 'test') {
            state = 'test';
        }
        else if (chunk.trim() == 'idle') {
            state = 'idle';
        }
        else if (chunk.trim() == 'exit'){
            process.exit(0);
        }
        else{
            process.stdout.write(chunk);
        }
        process.stdout.write(`${state}-->`);
    }
})


