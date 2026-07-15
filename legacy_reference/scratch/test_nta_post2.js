const https = require('https');
const querystring = require('querystring');

const postData = querystring.stringify({
  'KSTYPE': 'ksz',
  'kszZip': '4760004'
});

const options = {
  hostname: 'www.nta.go.jp',
  port: 443,
  path: '/taxes/shiraberu/shirabekata/c_search/index.php',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData),
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://www.nta.go.jp/about/organization/access/map.htm'
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Location:', res.headers.location);
    if(body.length < 500) console.log('Body:', body);
    else console.log('Body length:', body.length);
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.write(postData);
req.end();
