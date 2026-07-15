const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/customers',
  method: 'GET',
  headers: {
    'Cookie': 'employee_auth=fake-id'
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', (chunk) => {
    // just check if we get redirect or not
  });
  res.on('end', () => {
    console.log('No more data in response.');
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.end();
