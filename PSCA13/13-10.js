var dgram = require('dgram');
var client = dgram.createSocket('udp4');

let HOST='127.0.0.1';
let PORT = 40000;

client.on('close', function() {
    process.exit(0);
});

process.stdin.on('data', function (data) {
    client.send(data, 0, data.length, PORT, HOST, () => {
        console.log('Успешно отправлено');
    });
});

client.on('message', (message) => {
    console.log('Клиент получил от сервера: ' + message);
    client.close();
});