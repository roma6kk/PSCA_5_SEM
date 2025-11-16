let http = require('http');
let url = require('url');
let fs = require('fs');
let querystring = require('querystring');
let xml2js = require('xml2js');
let mp = require('multiparty');

let handler = (req, res) => {
    let p = url.parse(req.url, true);
    let q = url.parse(req.url, true).query;
    if (req.method == 'GET') {
        if (p.pathname == '/connection') {
            res.writeHead(200, { 'Content-type': 'text/plain;charset=utf-8' });
            res.end(`KeepAliveTimeout: ${server.keepAliveTimeout} мс`);
        }
        else if (p.pathname == '/connection/set') {
            try {
                let set = q.set;
                let timeout = parseInt(set, 10);
                server.keepAliveTimeout = timeout;
                res.writeHead(200, { 'Content-type': 'text/plain;charset=utf-8' });
                res.end(`New KeepAliveTimeout: ${server.keepAliveTimeout} мс`);
            }
            catch (e) {
                res.writeHead(400, { 'Content-type': 'text/plain;charset=utf-8' });
                res.end(`Error: ${e.message}`);
            }
        }
        else if (p.pathname == '/headers') {
            let reqHeaders = JSON.stringify(req.headers, null, 2);
            let customHeaderName = 'X-Some-header';
            let customHeaderValue = 'X-Some-Header-Value'
            res.setHeader('Content-type', 'text/plain;charset=utf-8');
            res.setHeader(customHeaderName, customHeaderValue);
            let resHeaders = JSON.stringify(res.getHeaders());
            res.end(`Заголовки запроса: ${reqHeaders}\n` +
                `Пользовательский заголовок: ${customHeaderName}: ${customHeaderValue}\n` +
                `Заголовки ответа: ${resHeaders}`);
        }
        else if (p.pathname == '/parameter') {
            let xval = q.x;
            let yval = q.y;
            if (isNaN(Number(xval)) || isNaN(Number(yval))) {
                res.writeHead(400, { 'Content-type': 'text/plain;charset=utf-8' });
                res.end('Ошибка парсинга параметров x и y');
            }
            else {
                let x = Number(xval);
                let y = Number(yval);
                res.writeHead(200, { 'Content-type': 'text/plain;charset=utf-8' });
                res.end(`sum: ${x + y}\ndif: ${x - y}\ncomp: ${x * y}\ndiv: ${x / y}`)
            }
        }
        else if (p.pathname.startsWith('/parameter/')) {
            let values = p.pathname.split('/')
            let xval = values[2];
            let yval = values[3];
            if (isNaN(Number(xval)) || isNaN(Number(yval))) {
                res.writeHead(400, { 'Content-type': 'text/plain;charset=utf-8' });
                res.end(decodeURI(req.url));
            }
            else {
                let x = Number(xval);
                let y = Number(yval);
                res.writeHead(200, { 'Content-type': 'text/plain;charset=utf-8' });
                res.end(`sum: ${x + y}\ndif: ${x - y}\ncomp: ${x * y}\ndiv: ${x / y}`)
            }
        }
        else if (p.pathname == '/close') {
            res.writeHead(200, { 'Content-type': 'text/plain;charset=utf-8' });
            res.end('Сервер закроется через 10 секунд.');
            setTimeout(() => process.exit(0), 10000);
        }
        else if (p.pathname == '/socket') {
            res.writeHead(200, { 'Content-type': 'text/plain;charset=utf-8' });
            res.end(`Клиент: \n IP: ${req.socket.remoteAddress} PORT: ${req.socket.remotePort}` +
                `\nСервер: \n IP: ${req.socket.localAddress} PORT: ${req.socket.localPort}`
            );
        }
        else if (p.pathname == '/resp-status') {
            let code = q.code;
            let message = q.mess;
            if (isNaN(Number(code)) || message === undefined || message === '') {
                res.writeHead(400, { 'Content-type': 'text/plain;charset=utf-8' });
                res.end('FAILED');
            }
            else {
                res.writeHead(code, message, { 'Content-type': 'text/plain;charset=utf-8' });
                res.end('SUCCESS');
            }

        }
        else if (p.pathname == '/form') {
            let file = fs.readFileSync('./static/form.html');
            res.writeHead(200, { 'Content-type': 'text/html;charset-utf-8' });
            res.end(file);
        }
        else if(p.pathname == '/files'){
            fs.readdir('./static', (err, files) => {
                if (err) {
                    res.writeHead(500, {
                        'Content-Type': 'text/plain',
                        'X-static-files-count': '0'
                    });
                    return res.end('Error reading static directory');
                }
                
                const fileCount = files.length;
                
                res.writeHead(200, {
                    'Content-Type': 'text/plain',
                    'X-static-files-count': fileCount.toString()
                });
                res.end(`Количество файлов ${fileCount}`); 
            });  
        }
       else if (p.pathname.startsWith('/files/')) {
            const filename = p.pathname.substring(7);
            if (filename.includes('..') || filename.startsWith('/') || filename.startsWith('\\')) {
                res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('Недопустимое имя файла');
                return;
            }
            const filePath = `./static/${filename}`;
            const stream = fs.createReadStream(filePath);
            stream.on('error', (err) => {
                console.error('Файл не найден:', err.message);
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('Файл не найден');
            });
            stream.on('open', () => {
                res.writeHead(200, {
                    'Content-Type': 'application/octet-stream', 
                    'Content-Disposition': `attachment; filename="${filename}"`,
                });
            });

            stream.pipe(res);
        }
        else if(p.pathname == '/upload'){
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            fs.createReadStream('./static/uploadform.html').pipe(res);
        }
    }
    else if (req.method == 'POST') {
        if (p.pathname == '/req-data') {
            res.writeHead(200, { 'Content-type': 'text/plain;charset=utf-8' });
            res.write('CHUNKS:')
            req.on("data", (chunk) => {
                res.write(chunk + '\n====================\n')
            })
            req.on('end', () => {
                res.end("FINISHED");
            })
        }
        else if (p.pathname == '/formparameter') {
            let data = '';
            req.on('data', (chunk) => data += chunk.toString());
            req.on('end', () => {
                let params = querystring.parse(data);
                res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end(JSON.stringify(params));
            })
        }
        else if (p.pathname == '/json') {
            let data = '';
            req.on('data', (chunk) => {
                data += chunk.toString();
            });
            req.on('end', () => {
                jsondata = JSON.parse(data);
                let x = Number(jsondata.x);
                let y = Number(jsondata.y)
                let comment = jsondata.__comment;
                let s = jsondata.s;
                let m = jsondata.m;
                let o = jsondata.o;
                let response = {
                    "__comment": comment.replace('Запрос', 'Ответ'),
                    "x_plus_y": x + y,
                    "Concatination_s_o": s + ': ' + o.surname + ', ' + o.name,
                    "Length_m": m.length
                };
                res.writeHead(200, { 'Content-type': 'application/json;charset=utf-8' });
                res.end(JSON.stringify(response));
            })
        }
        else if (p.pathname == '/xml') {
            let data = '';
            req.on('data', (chunk) => {
                data += chunk.toString();
            });
            req.on('end', () => {
                const parser = new xml2js.Parser();
                parser.parseString(data, (err, result) => {
                    if (err) {
                        throw new Error('Invalid XML format');
                    }
                    const request = result.request;
                    const requestId = request.$.id;
                    let sum = 0;
                    if (request.x) {
                        request.x.forEach(xElement => {
                            sum += parseInt(xElement.$.value) || 0;
                        });
                    }
                    let concatResult = '';
                    if (request.m) {
                        request.m.forEach(mElement => {
                            concatResult += mElement.$.value || '';
                        });
                    }
                    const responseObj = {
                        response: {
                            $: {
                                id: Math.floor(Math.random() * 100),
                                request: requestId
                            },
                            sum: {
                                $: {
                                    element: 'x',
                                    result: sum.toString()
                                }
                            },
                            concat: {
                                $: {
                                    element: 'm',
                                    result: concatResult
                                }
                            }
                        }
                    };
                    const builder = new xml2js.Builder();
                    const xmlResponse = builder.buildObject(responseObj);
                    res.writeHead(200, { 'Content-Type': 'application/xml' });
                    res.end(xmlResponse);
                });
            });
        }
        else if(p.pathname == '/upload')
        {
            let form = new mp.Form({uploadDir:'./static'});
            form.on('field', (name, value) => {
                console.log('----------field----------');
                console.log(name, value);
            });
            form.on('file', (name, file) => {
                console.log('----------file-------');
                console.log(name, file);
            })
            form.on('close', () => {
                res.writeHead(200, {'Content-type': 'text/html;charset=utf-8'});
                res.end('<h1>Uploaded</h1>')
            });
            form.on('error', (err) => {
                console.log('err = ', err);
                res.writeHead(200, {'Content-type': 'text/html;charset=utf-8'});
                res.end('<h1>ERROR</h1>');
            })
            form.parse(req);
        }
    }
}
let server = http.createServer(handler).listen(3000);
console.log("Server running on http://localhost:3000/")