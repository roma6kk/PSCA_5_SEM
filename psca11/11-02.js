const WebSocket = require('ws');
const fs = require('fs');

const wss = new WebSocket.Server({ port: 4000, host: 'localhost' });

wss.on('connection', (ws) => {
  console.log('Клиент подключился');

  const readStream = fs.createReadStream('./file1.txt', { encoding: 'utf8' });

  readStream.on('data', (chunk) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(chunk);
    }
  });

  readStream.on('end', () => {
    console.log('Файл успешно отправлен');
  });

  readStream.on('error', (err) => {
    console.error('Ошибка чтения файла:', err.message);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send('Ошибка: не удалось прочитать файл');
    }
  });

  ws.on('close', () => {
    console.log('Клиент отключился');
    readStream.destroy();
  });
});