var http = require('http')
var url = require('url')
var data = require('./DB');

var db = new data.DB();

db.on('GET', (req, res) => {
    console.log('DB.GET');
    res.end(JSON.stringify(db.get()));
});

db.on('POST', (req, res) => {
    console.log('DB.POST');
    req.on('data', data =>{
        let r = JSON.parse(data);
        db.post(r);
        res.end(JSON.stringify(r));
    });
});

db.on('PUT', (req, res) => {
    console.log('DB.PUT');
    req.on('data', data => {
        let r = JSON.parse(data);
        db.put(r) ? res.end('SUCCESS') : res.end('ERROR');
    })
})

db.on('DELETE', (req, res) => {
    console.log('DB.DELETE');
    let parsedUrl = url.parse(req.url, true);
    let id = parseInt(parsedUrl.query.id, 10);
    let result = db.delete(id);
    res.end(JSON.stringify(result));
})

http.createServer(function (request, response) {
    if(url.parse(request.url).pathname === '/api/db')
    {
    db.emit(request.method, request, response);
    }
}).listen(3000);
console.log('Server running at http://localhost:3000');