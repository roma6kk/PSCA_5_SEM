let http = require('http');
let query = require('querystring');

let parms = query.stringify({x:3, y:4, s:'xxx'});
let path = `/mypath?${parms}`;

console.log('parms: ', parms);
console.log('path', path);

let options = {
    host: 'localhost',
    path: path,
    port: 3000,
    method: 'GET'
}

const req = http.request(options, (res) => {
    let data ='';
    res.on('data', (chunk) => {
        console.log('http.request: data: body =', data += chunk.toString('utf8'));
    })
    res.on('end', () => {console.log('StatusCode: ', res.statusCode); console.log('data:', data)});
});

req.on('error', (e) => {console.log('http.request: error:', e.message)});
req.end()