const WebSocket = require('rpc-websockets').Client;

let ws = new WebSocket('ws://localhost:4000');

ws.on('open', () => {
  ws.subscribe('B');

  ws.on('B', (data) => {
    console.log('Пришло событие B:', data);
  });

  console.log('Клиент B подключен и подписан на событие B');
});

ws.on('error', (err) => {
  console.error('Ошибка WebSocket:', err);
});