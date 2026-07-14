const https = require('https');
const query = encodeURIComponent('site:nta.go.jp 税務署 4760004');
const options = {
  hostname: 'search.yahoo.co.jp',
  path: '/search?p=' + query,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
};
https.get(options, (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    require('fs').writeFileSync('scratch/yahoo.html', data);
    console.log('Saved to scratch/yahoo.html');
  });
});
