// client.js
const WebSocket = require('ws');

const clientName = process.argv[2];

if (!clientName) {
  console.error('Использование: node client.js <имя_клиента>');
  process.exit(1);
}

const ws = new WebSocket('ws://localhost:4000');

ws.on('open', () => {
  const message = {
    client: clientName,
    timestamp: Date.now()
  };
  console.log(`[${clientName}] Отправляю:`, JSON.stringify(message));
  ws.send(JSON.stringify(message));
});

ws.on('message', (data) => {
  const response = JSON.parse(data.toString());
  console.log(`[${clientName}] Получено:`, JSON.stringify(response));
  ws.close();
});

ws.on('error', (err) => {
  console.error(`[${clientName}] Ошибка:`, err.message);
});

ws.on('close', () => {
  console.log(`[${clientName}] Соединение закрыто`);
});