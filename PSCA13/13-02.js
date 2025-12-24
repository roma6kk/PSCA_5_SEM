const net = require('net');

let HOST = '127.0.0.1';
let PORT = 40000;

let client = new net.Socket();

client.connect(PORT, HOST, () => {
    console.log('Клиент подключился к серверу: ', client.remoteAddress + ':' + client.remotePort);
    client.write('Hello');
});

client.on('data', (data) => {
    console.log('Сервер ответил: ', data.toString());
    client.destroy();
});