var dgram = require('dgram');

var server = dgram.createSocket('udp4');

let HOST='0.0.0.0';
let PORT = 40000;

server.bind(PORT, HOST, ()=> {
    console.log('UDP-сервер слушает порт: '+ PORT);
});

server.on('message', (message, rinfo) => {
    console.log('Сервер получил: ' + message + ' от клиента ' + rinfo.address + ':' + rinfo.port);    
    var answer = "ECHO: " + message;
    server.send(answer, 0, answer.length, rinfo.port, '127.0.0.1', () => {});
});