const fs = require('fs');
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:4000');
let k = 0;
ws.on('open', () => {
  const duplex = WebSocket.createWebSocketStream(ws, {encoding: 'utf-8'});
  let wfile = fs.createWriteStream(`./MyFile${++k}.txt`);
  duplex.pipe(wfile);
});