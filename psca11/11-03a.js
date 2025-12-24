const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:4000');

ws.on('open', () => {
  console.log('Подключено к серверу');
});

ws.on('message', (data) => {
  console.log('Получено от сервера:', data.toString());
});

ws.on('pong', () => {
  console.log('Получен pong от сервера');
});

ws.on('ping', (data) => {
  console.log('Получен ping от сервера', data.toString());
});

ws.on('close', () => {
  console.log('Соединение закрыто');
});

ws.on('error', (err) => {
  console.error('Ошибка клиента:', err);
});
