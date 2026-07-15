// test_fetch.js
const http = require('http');

const options = {
  host: 'localhost',
  port: 3000,
  path: '/api/generate-form',
  method: 'GET',
  headers: {
    'Cookie': 'employee_auth=12345678-1234-1234-1234-123456789012',
    'Host': '127.0.0.1:3001',
    'X-Forwarded-Host': '127.0.0.1:3001'
  }
};

const req = http.request(options, (res) => {
  console.log('STATUS:', res.statusCode);
  console.log('HEADERS:', JSON.stringify(res.headers));
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log('BODY:', chunk);
  });
});

req.on('error', (e) => {
  console.error('problem with request:', e.message);
});

req.end();
