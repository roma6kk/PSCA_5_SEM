const WebSocketServer = require('rpc-websockets');

const server = new WebSocketServer.Server({
  port: 4000,
  host: 'localhost',
});

console.log('ws launched on ws://localhost:4000');

server.register('A', (params) => {
  console.log('Получено уведомление A:', params);
});

server.register('B', (params) => {
  console.log('Получено уведомление B:', params);
});

server.register('C', (params) => {
  console.log('Получено уведомление C:', params);
});

server.on('connection', (socket) => {
  console.log('Клиент подключился');
});

server.on('closed', (socket) => {
  console.log('Клиент отключился');
});