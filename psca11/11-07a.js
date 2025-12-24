const { Client } = require('rpc-websockets');

const client = new Client('ws://localhost:4000');

client.on('open', () => {
  console.log('Введите A, B или C — и нажмите Enter, чтобы отправить уведомление.');
  console.log('Для выхода нажмите Ctrl+C.');
});

process.stdin.setEncoding('utf8');
process.stdin.on('data', (input) => {
  const cmd = input.trim().toUpperCase();
  if (cmd === 'A') {
    client.notify('A', { message: 'Уведомление A', time: Date.now() });
    console.log('Отправлено: A');
  } else if (cmd === 'B') {
    client.notify('B', { message: 'Уведомление B', time: Date.now() });
    console.log('Отправлено: B');
  } else if (cmd === 'C') {
    client.notify('C', { message: 'Уведомление C', time: Date.now() });
    console.log('Отправлено: C');
  } else {
    console.log('Введите только A, B или C');
  }
});

client.on('error', (err) => {
  console.error('Ошибка WebSocket:', err.message);
  process.exit(1);
});

client.on('close', () => {
  console.log('Соединение закрыто');
});