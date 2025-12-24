const WebSocket = require('rpc-websockets').Client;

let ws = new WebSocket('ws://localhost:4000');

ws.on('open', () => {
  ws.subscribe('A');

  ws.on('A', (data) => {
    console.log('Пришло событие A:', data);
  });

  console.log('Клиент A подключен и подписан на событие A');
});

ws.on('error', (err) => {
  console.error('Ошибка WebSocket:', err);
});