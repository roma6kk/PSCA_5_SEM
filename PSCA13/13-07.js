const net = require('net');

let HOST = '0.0.0.0';
let PORT1 = 40000;
let PORT2 = 50000;

let h = () => { return (sock) => {
    console.log('К серверу подключился клиент: ' + sock.remoteAddress + ':' + sock.remotePort);

    sock.on('data', (data) => {
        console.log('Число: ', data.toString());
        sock.write('ECHO:' + data);
    });

    sock.on('close', (data) => {
        console.log("Сервер закрыт");
    });
  };
};

net.createServer(h(PORT1)).listen(PORT1, HOST).on('listening', () => {
    console.log('1. TCP-сервер слушает порт: '+ PORT1);
});

net.createServer(h(PORT2)).listen(PORT2, HOST).on('listening', () => {
    console.log('2. TCP-сервер слушает порт: ' + PORT2);
});