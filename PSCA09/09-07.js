let http = require('http');
let fs = require('fs');

let bound = 'arv369-arv369-arv369';
let body = `--${bound}\r\n`;
    body += 'Content-Disposition:form-data; name="file"; filename="dog.png"\r\n';
    body += 'Content-Type:application/octet-stream\r\n\r\n';

let options = {
    host: 'localhost',
    path: '/bmp',
    port: 3000,
    method: 'POST',
    headers: {'Content-Type': 'multipart/form-data; boundary='+bound}
}

let req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    })
    res.on('end', () => {
        console.log('http.response: end length body =', Buffer.byteLength(data));
    });
});
req.on('error', (e) => {console.log('http.request: error: ', e.nessage)});

req.write(body);

let stream = new fs.ReadStream('D:\\Poman\\prog\\PSCA\\PSCA09\\dog.png');
stream.on('data', (chunk) => {
    req.write(chunk);
    console.log(Buffer.byteLength(chunk));
});
stream.on('end', () => {
    req.end(`\r\n--${bound}--\r\n`);
})
