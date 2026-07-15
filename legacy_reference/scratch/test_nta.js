const https = require('https');
const fs = require('fs');

https.get('https://www.nta.go.jp/about/organization/access/map.htm', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    fs.writeFileSync('scratch/nta_map.html', data);
    console.log('Saved to scratch/nta_map.html');
  });
});
