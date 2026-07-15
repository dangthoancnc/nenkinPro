const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3015,
  path: '/api/dashboard',
  method: 'GET',
  headers: {
    'Cookie': 'employee_auth=test-fake-uuid'
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.setEncoding('utf8');
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    console.log(`BODY: ${body}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.end();
