const net = require('net');

let HOST = '0.0.0.0';
let PORT = 40000;

let server = net.createServer();

server.on('connection', (sock) => {
    let sum = 0;
    let clientId = `${sock.remoteAddress}:${sock.remotePort}`;
    
    console.log(`К серверу подключился клиент: ${clientId}`);
    
    sock.on('data', (data) => {
        let number = data.readInt32LE();
        console.log(`Число от ${clientId}: ${number}`);
        sum += number;
    });
    
    let buf = Buffer.alloc(4);
    
    let timer = setInterval(() => {
        console.log(`Отправка суммы ${sum} клиенту ${clientId}`);
        buf.writeInt32LE(sum, 0);
        sock.write(buf);
    }, 5000);

    sock.on('close', () => {
        console.log(`Клиент отключен: ${clientId}`);
        clearInterval(timer);
    });
});

server.listen(PORT, HOST);
console.log('Сервер слушает порт: ' + PORT);