let http = require('http');

let jsonm = JSON.stringify({
    "__comment": " Запрос.Лабораторная работа 9/10",
    "x": 1,
    "y": 2,
    "s": "Сообщение",
    "m": ["a", "b", "c", "d"],
    "o": {"surname": "Иванов", "name": "Иван"}
});
console.log('parms: ', JSON.parse(jsonm));

let options = {
    host: 'localhost',
    path: '/',
    port: 3000,
    method: 'POST',
    headers: {
        'content-type': 'application/json', 'accept':'application/json'
    }
}

const req = http.request(options, (res) => {
    let data ='';
    res.on('data', (chunk) => {
        console.log('http.request: data: body =', data += chunk.toString('utf8'));
    })
    res.on('end', () => {console.log('StatusCode: ', res.statusCode); console.log(`data: ${data}`)});
});

req.on('error', (e) => {console.log('http.request: error:', e.message)});
req.write(jsonm);
req.end();