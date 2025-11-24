let http = require('http');
let url = require('url');
let xml2js = require('xml2js');
let fs = require('fs');

http.createServer((req,res) => {
    if(url.parse(req.url).pathname == '/getinfo' && req.method == 'GET') {
        console.log('request accepted');
        res.end('GET request successfully accepted');
    }

    else if(url.parse(req.url).pathname.startsWith('/mypath') && req.method == 'GET'){
        parms = url.parse(req.url, true).query;
        console.log(`Request accepted, parms: ${parms.x}, ${parms.y}, ${parms.s}`);
        res.end(`Request accepted, parms: ${parms.x}, ${parms.y}, ${parms.s}`);
    }

    else if(url.parse(req.url).pathname == '/mypath' && req.method == 'POST'){
        let data = '';
        req.on('data', (chunk) => {
            data += chunk;
        })
        req.on('end', () => {
            console.log(`Accepted data: ${data}`);
            res.end(`Request accepted, data:${data}`);
        })
    }

    else if(url.parse(req.url).pathname == '/' && req.method == 'POST'){
        let data = '';
        req.on('data', (chunk) => {
            data += chunk.toString();
        });
        req.on('end', () => {
            let jsondata = JSON.parse(data);
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

    else if(url.parse(req.url).pathname == '/xml' && req.method == 'POST'){
        let data = '';
        req.on('data', (chunk) => {
            data += chunk;
        })
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

    else if(url.parse(req.url).pathname == '/txt' && req.method == 'POST')
    {
        let data = [];
        req.on('data', (chunk) => {
            data.push(chunk);
        } );
        req.on('end', () => {
            let contentType = req.headers['content-type'];
            let bound = contentType.match(/boundary=(.+)/)[1];

            let body = Buffer
            .concat(data)
            .toString()
            .split(`--${bound}\r\n`)[1];

            const headerEnd = body.indexOf('\r\n\r\n'); 
            const headers = body.substring(0, headerEnd);
            const filename = headers.match(/filename="([^"]+)"/)[1];

            let fileData = body.substring(headerEnd + 4);
            const endIndex = fileData.indexOf(`\r\n--${bound}`);
            fileData = fileData.substring(0, endIndex);
            
            fs.writeFileSync(`./static/${filename}`, fileData)
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(`File ${filename} saved.`);
        })
    }

    else if(url.parse(req.url).pathname == '/bmp' && req.method == 'POST'){
        const contentType = req.headers['content-type'];
        const boundary = "--" + contentType.split("boundary=")[1];

        let buffer = Buffer.alloc(0);
        let fileStream = null;
        let headersParsed = false;

        req.on("data", chunk => {
            buffer = Buffer.concat([buffer, chunk]);

            if (!headersParsed) {
                const headerEnd = buffer.indexOf("\r\n\r\n");

                if (headerEnd !== -1) {
                    const headerPart = buffer.slice(0, headerEnd).toString();
                    const filenameMatch = headerPart.match(/filename="([^"]+)"/);
                    if (!filenameMatch) return;

                    const filename = filenameMatch[1];

                    fileStream = fs.createWriteStream(`./static/${filename}`);
                    headersParsed = true;

                    buffer = buffer.slice(headerEnd + 4);
                }
            }
            if (headersParsed) {
                const boundaryIndex = buffer.indexOf(boundary);

                if (boundaryIndex !== -1) {

                    const dataToWrite = buffer.slice(0, boundaryIndex - 2);

                    if (fileStream) fileStream.write(dataToWrite);
                    if (fileStream) fileStream.end();

                    headersParsed = false;
                    buffer = buffer.slice(boundaryIndex + boundary.length);

                    res.writeHead(200, { "Content-Type": "text/plain" });
                    res.end("File upload complete");
                }
            }
        });

        req.on("end", () => {});
    }

    else if (url.parse(req.url).pathname.startsWith('/getbmp') && req.method === 'GET') {

        const filepath = url.parse(req.url).pathname.split('/')[1];

        if (!fs.existsSync(filepath)) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return res.end('File not found');
        }

        res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Disposition': 'attachment; filename="file.png"'
        });

        const fileStream = fs.createReadStream(filepath);
        fileStream.pipe(res);

        fileStream.on('error', () => {
            res.writeHead(500);
            res.end('File read error');
        });
                    
        return;
    }
}).listen(3000);
console.log('Server running at http://localhost:3000')