const WebSocket = require('ws');
const fs = require('fs');


wss = new  WebSocket.Server({port: 4000, host: 'localhost'});
let k = 0;
wss.on('connection', (ws) => {
  const duplex = WebSocket.createWebSocketStream(ws, {encoding: 'utf-8'});
  let wfile = fs.createWriteStream(`./upload/file${++k}.txt`);
  duplex.pipe(wfile);
})
console.log('server listening ws://localhost:4000');