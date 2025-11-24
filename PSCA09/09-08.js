const http = require('http');
const fs = require('fs');

const file = fs.createWriteStream("file.png");

let options = {
    host: 'localhost',
    path: '/getbmp/dog.png',
    port: 3000, 
    method: 'GET'
}

const req = http.request(options, (res) => {
    res.pipe(file)
});
req.on('error', (e) => {console.log('http.request: error: ', e.message);});
req.end();