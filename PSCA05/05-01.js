var http = require('http')
var url = require('url')
var fs = require('fs')
var data = require('./DB');

var db = new data.DB();
let statCounter = null;
let lastStat = null;

db.on('GET', (req, res) => {
    console.log('DB.GET');
    res.end(JSON.stringify(db.get()));
if (statCounter !== null) {
        statCounter.requests++;
    }
});

db.on('POST', (req, res) => {
    console.log('DB.POST');
    req.on('data', data =>{
        let r = JSON.parse(data);
        db.post(r);
        res.end(JSON.stringify(r));
    });
if (statCounter !== null) {
        statCounter.requests++;
    }
});

db.on('PUT', (req, res) => {
    console.log('DB.PUT');
    req.on('data', chunk => {
        let r = JSON.parse(chunk);
        const success = db.put(r);
        res.end(JSON.stringify({ 
            success: success,
            message: success ? 'updated' : 'error'
        }));
    });
if (statCounter !== null) {
        statCounter.requests++;
    }
})

db.on('DELETE', (req, res) => {
    console.log('DB.DELETE');
    req.on('data', data => {
        let r = JSON.parse(data);
        let id = r.id;
        let dr = JSON.stringify(db.delete(id));
        res.end(dr);
    })
if (statCounter !== null) {
        statCounter.requests++;
    }
})

db.on('commit', () => {
    console.log('DB.COMMIT');
    db.commit();
    process.stdout.write('\n-->');
    if (statCounter !== null) {
        statCounter.commits++;
    }
})

const server = http.createServer(function (request, response) {
    if(url.parse(request.url).pathname === '/')
    {
        let html = fs.readFileSync('../PSCA04/04-02.html');
        response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
        response.end(html);
    }
    else if(url.parse(request.url).pathname === '/api/db')
    {
        db.emit(request.method, request, response);
    }
    else if(url.parse(request.url).pathname === '/api/ss')
    {
        response.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
        if(lastStat !== null)
            response.end(JSON.stringify(lastStat));
        else 
            response.end('No statistic');
    }
}).listen(3000);
console.log('Server running at http://localhost:3000');

process.stdout.write('-->');
let timer = null;
let interval = null;
let statTimer = null;
process.stdin.on('readable', () => {
    let chunk = null;
    while((chunk = process.stdin.read()) !== null)
    {

        let chunkStr = chunk.toString().trim();
        if(chunkStr.substring(0,2) == 'sd')
        {
            if(timer !== null)
            {
                clearTimeout(timer);
                timer = null;
            }
            let parameters = chunkStr.split(' ');

            if(parameters.length === 1)
            {
                process.stdout.write('\n-->');
                continue;
            }
            const seconds = parseInt(parameters[1], 10);

            timer = setTimeout(() => {
                server.close();
            }, seconds * 1000); 
            process.stdout.write('\n-->');
        }


        if(chunkStr.substring(0,2) === 'sc')
        {
            clearInterval(interval);
            interval = null;
            
            let parameters = chunkStr.split(' ');
            if(parameters.length !== 1)
            {
                let seconds = parseInt(parameters[1], 10) * 1000;
                interval = setInterval(() => {
                    db.emit('commit');
                }, seconds);
                interval.unref()
            }
            process.stdout.write('-->');
        }

        if(chunkStr.substring(0,2) === 'ss')
        {
            if (statTimer !== null) {
            clearTimeout(statTimer);
            statTimer = null;
            statCounter = null;
            }

            let parameters = chunkStr.split(' ');
            if(parameters.length !== 1)
            {
                lastStat = null;
                let seconds = parseInt(parameters[1], 10) * 1000;
                statCounter = {start: Date(),requests: 0, commits: 0};
                statTimer = setTimeout(() => {
                    lastStat = statCounter;
                    lastStat.finish = Date();
                    statTimer = null;
                    statCounter = null;
                    process.stdout.write(`\nRequsts: ${lastStat.requests}\n
                        Commits: ${lastStat.commits}\n
                        start: ${lastStat.start}\n
                        finish: ${lastStat.finish}\n
                        -->`)
                }, seconds)
                statTimer.unref();
            }
        }
    }
});
process.stdin._handle.unref();


