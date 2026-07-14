const https = require('https');
const data = 'q=' + encodeURIComponent('site:nta.go.jp/about/organization/ 税務署 4760004');
const options = {
  hostname: 'lite.duckduckgo.com',
  path: '/lite/',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': data.length,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  }
};
const req = https.request(options, (res) => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    const fs = require('fs');
    fs.writeFileSync('scratch/ddg.html', body);
    console.log('Saved to scratch/ddg.html');
  });
});
req.write(data);
req.end();
