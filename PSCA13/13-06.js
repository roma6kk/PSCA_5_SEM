const net = require('net');

let HOST = '127.0.0.1';
let PORT = 40000;

let client = new net.Socket();
let buf = new Buffer.alloc(4);
let timerID = null;

client.connect(PORT, HOST, () => {
    console.log('Клиент подключился к серверу:', client.remoteAddress + ':' + client.remotePort);
    
    let x = parseInt(process.argv[2]);
    
    timerID = setInterval(() => { 
        client.write((buf.writeInt32LE(x, 0), buf));
    }, 1000);

    setTimeout(() => {
        clearInterval(timerID);
        client.end();
    }, 20000);
});

client.on('data', (data) => {
    console.log('Промежуточная сумма: ', data.readInt32LE());
});