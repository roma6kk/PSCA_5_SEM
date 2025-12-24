const net = require('net');

let HOST = '0.0.0.0';
let PORT = 40000;

net.createServer((sock) => {
    console.log('К серверу подключился клиент: ' + sock.remoteAddress + ':' + sock.remotePort);

    sock.on('data', (data) => {
        console.log('Строка от клиента: ' + data);
        sock.write('ECHO: ' + data);
    });

    sock.on('close', (data) => {
        console.log("Сервер закрыт");
    });

}).listen(PORT, HOST);

console.log('TCP-сервер слушает порт: ' + PORT);