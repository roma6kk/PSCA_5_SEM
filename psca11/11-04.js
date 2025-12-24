const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 4000, host: 'localhost' });

let messageCounter = 0;

wss.on('connection', (ws) => {
  console.log('Новое соединение установлено');

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());

      messageCounter++;
      const response = {
        server: messageCounter,
        client: msg.client,
        timestamp: Date.now()
      };

      ws.send(JSON.stringify(response));
    } catch (err) {
      console.error('Ошибка обработки сообщения:', err.message);
      ws.send(JSON.stringify({ error: 'Invalid message format' }));
    }
  });

  ws.on('close', () => {
    console.log('Соединение закрыто');
  });

  ws.on('error', (err) => {
    console.error('Ошибка WebSocket:', err);
  });
});

console.log('WebSocket-server running on ws://localhost:4000');