function Stat(sfn = './static')
{
    this.STATIC_FOLDER = sfn;
    let pathStatic = (fn) => {return `${this.STATIC_FOLDER}${fn}`;};
    this.writeHTTP404 = (res) => {
        res.statusCode = 404;
        res.statusMessage = 'Resource not found';
        res.end("Resource not found");
    }
    let fs = require('fs');
    let pipeFile = (req,res,headers) => {
        res.writeHead(200, headers);
        fs.createReadStream(pathStatic(req.url)).pipe(res);
    }
    this.isStatic = (ext,fn) => { let reg = new RegExp(`^\/.+\.${ext}$`); return reg.test(fn);}
    this.sendFile = (req,res,headers) => {
        fs.access(pathStatic(req.url), fs.constants.R_OK, err => {
            if(err) this.writeHTTP404(res);
            else pipeFile(req,res,headers);
        })
    }
    this.writeHTTP405 = (res) => {
    res.statusCode = 405;
    res.statusMessage = 'Unsupportable method';
    res.end('Unsupportable method');
    }

}

module.exports = (parm) => {return new Stat(parm);}