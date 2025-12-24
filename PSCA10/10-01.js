const httpserver = require('http');

httpserver.createServer((req, res) => {
    if(req.method == 'GET' && req.url == '/start'){
        res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
        res.end(require('fs').readFileSync('./10-01.html'));
    }
}).listen(3000);

console.log('server launched on http://localhost:3000/start')

const WebSocket = require('ws');
let k = 0;
let n = 0;
const wsserver = new WebSocket.Server({
    port: 4000,
    host: 'localhost',
    path: '/wsserver'
});
wsserver.on('connection', (ws) => {
    ws.on('message', message => {
        console.log(`Recieved message => ${message}`);
        n = message.toString().split('10-01-client: ')[1];
    })
    setInterval(() => {
        ws.send(`10-01-server: ${n}->${++k}`)
    }, 5000)
});
wsserver.on('error', () => {
    console.log('ws server error', e);
});