const WebSocket = require('ws');
let n = 0;
let ws = new WebSocket('ws://localhost:5000/broadcast');
ws.onopen = () => {
    console.log('ws.onopen');
    setInterval(() => { ws.send(`10-01-client: ${++n}`); }, 3000);
    setTimeout(() => { ws.close() }, 25000)
};
ws.onclose = (e) => { console.log(`ws onclose: ${e}`); };
ws.onmessage = (e) => {
    console.log(`ws.onmessage: ${e.data}`);
};
ws.onerror = function (error) { console.log(`Ошибка: ${error.message}`); };
