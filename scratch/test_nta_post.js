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
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    // Write out the result
    require('fs').writeFileSync('scratch/nta_post.html', body);
    console.log('Status Code:', res.statusCode);
    if(res.statusCode >= 300 && res.statusCode < 400) {
        console.log('Location:', res.headers.location);
    }
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.write(postData);
req.end();
