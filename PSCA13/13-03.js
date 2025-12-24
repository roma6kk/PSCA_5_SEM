const net = require('net');

let HOST = '0.0.0.0';
let PORT = 40000;

let server = net.createServer();

let sum = 0;

server.on('connection', (sock) => {
    console.log('К серверу подключился клиент: ' + sock.remoteAddress + ':' + sock.remotePort);
    
    sock.on('data', (data) => {
        let number = data.readInt32LE();
        console.log('Число от клиента: ', number);
        sum += number;
    }); 
    
    let buf = Buffer.alloc(4);

    let x = setInterval(() => {
        buf.writeInt32LE(sum, 0);
        sock.write(buf);
    }, 5000);

    sock.on('close', (data) => {
        console.log("Клиент отключился");
        clearInterval(x);
    });

    sock.on('error', (err) => {
        console.log("Ошибка сервера: ", err);
        clearInterval(x);
    });
});

server.listen(PORT, HOST);
console.log('TCP-сервер слушает порт: ' + PORT);