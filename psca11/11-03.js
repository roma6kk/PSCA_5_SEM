const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 4000, host: 'localhost' });

let messageCounter = 0;

const clients = new Set();

const broadcastInterval = setInterval(() => {
  messageCounter++;
  const message = `11-03-server: ${messageCounter}`;
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}, 15000);

const pingInterval = setInterval(() => {
  for (const client of clients) {
    if (client.isAlive === false) {
      client.terminate();
      clients.delete(client);
    } else {
      client.isAlive = false;
      client.ping();
    }
  }
  console.log(`Работоспособных соединений: ${clients.size}`);
}, 5000);

wss.on('connection', (ws) => {
  ws.isAlive = true;
  clients.add(ws);

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('close', () => {
    clients.delete(ws);
  });

  ws.on('message', (data) => {
    console.log('Сообщение от клиента:', data.toString());
  });

  ws.on('error', (err) => {
    console.error('Ошибка WebSocket:', err);
    clients.delete(ws);
  });
});

wss.on('error', (err) => {
  console.error('Ошибка сервера WebSocket:', err);
});

console.log('WebSocket-server running on ws://localhost:4000');