let http = require('http');
let xmlbuilder = require('xmlbuilder');
let parseString = require('xml2js').parseString;

let xmldoc = xmlbuilder.create('request')
    .att('id', '28')
    .ele('x').att('value', '1').up()
    .ele('x').att('value', '2').up()
    .ele('m').att('value', 'a').up()
    .ele('m').att('value', 'b').up()
    .ele('m').att('value', 'c').up();

let options = {
    host: 'localhost',
    path: '/xml',
    port: 3000,
    method: 'POST',
    headers: {
        'Content-type': 'text/xml;charset=utf-8',
        'Accept': 'text/xml'
    }
}

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk});
    res.on('end', () => {
        console.log('http.response: end: body = ', data);
        parseString(data, (err, str) => {
            if(err) {
                console.log('xml parse error: ', err.message);
            }
            else{
                console.log('=== Parsed XML ===');
                console.log('str = ', JSON.stringify(str, null, 2));
                console.log('str.response =', JSON.stringify(str.response, null, 2));
                console.log('sum result =', str.response.sum[0].$.result);
                console.log('concat result =', str.response.concat[0].$.result);
            }
        })
    });
});

req.on('error', (e) => {console.log('http.request: error:', e.message)});
req.end(xmldoc.toString({ pretty: true }));