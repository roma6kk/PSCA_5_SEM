const WebSocket = require('rpc-websockets').Client;

let ws = new WebSocket('ws://localhost:4000');

ws.on('open', () => {
  ws.subscribe('C');

  ws.on('C', (data) => {
    console.log('Пришло событие C:', data);
  });

  console.log('Клиент C подключен и подписан на событие C');
});

ws.on('error', (err) => {
  console.error('Ошибка WebSocket:', err);
});