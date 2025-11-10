var http = require('http');
var url = require('url');
var fs = require('fs');
const {parse} = require('querystring');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
 host: "smtp.gmail.com",
  port: 587,
  secure: false, 
  auth: {
    user: "romaananyev10@gmail.com",
    pass: "oilo czsm digf dvox",
  },
})

async function send(to, from, html, subject = 'THEME')
{
    const info = {
        to: to,
        from: from,
        subject: subject,
        html: html
    };
    await transporter.sendMail(info, (err, info) =>{
        if(err) console.log(err.message);
        else console.log("Message sent:", info.messageId);
    });
    
}

let http_handler = (req, resp) => {
    resp.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    if(url.parse(req.url).pathname == '/' && req.method == 'GET')
    {
        resp.end(fs.readFileSync('./06-02.html'));
    }
    else if(url.parse(req.url).pathname == '/' )
    {
        let body = '';
        req.on('data', chunk => {body += chunk.toString();});
        req.on('end', () => {
            let parm = parse(body);
            send(parm.reciever, parm.sender, parm.message)
            resp.end(`<h1>OK: ${parm.reciever}, ${parm.sender}, ${parm.message} </h1>`)
        })
    }
    else resp.end('<h1>Not support</h1>');
}

let server = http.createServer(http_handler);
server.listen(3000);
console.log('server running at http://localhost:3000');