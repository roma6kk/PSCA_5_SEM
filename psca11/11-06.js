const rpcWSS = require('rpc-websockets').Server;

let server = new rpcWSS({ port: 4000, host: 'localhost' });

server.event('A');
server.event('B');
server.event('C');

let counter = 0;

process.stdin.setEncoding('utf8');
process.stdin.on('data', (input) => {
  const cmd = input.trim().toUpperCase();
  if (cmd === 'A') {
    counter++;
    server.emit('A', { event: 'A', id: counter, timestamp: Date.now() });
    console.log(`Событие A отправлено (id=${counter})`);
  } else if (cmd === 'B') {
    counter++;
    server.emit('B', { event: 'B', id: counter, timestamp: Date.now() });
    console.log(`Событие B отправлено (id=${counter})`);
  } else if (cmd === 'C') {
    counter++;
    server.emit('C', { event: 'C', id: counter, timestamp: Date.now() });
    console.log(`Событие C отправлено (id=${counter})`);
  } else {
    console.log(`Неизвестная команда: '${cmd}'. Введите A, B или C.`);
  }
});

console.log('WebSocket-сервер 11-06 запущен на ws://localhost:4000');
console.log('Введите в консоль: A, B или C — чтобы сгенерировать соответствующее событие.');