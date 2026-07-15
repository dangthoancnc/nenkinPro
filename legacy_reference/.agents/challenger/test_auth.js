const http = require('http');

async function runTests() {
  const targetHost = 'localhost';
  const targetPort = 3000; 
  const path = '/api/generate-form';
  const fakeUUID = '12345678-1234-1234-1234-123456789012'; // Random UUID

  console.log("=== Starting Auth Bypass Tests ===");

  // Test 1: Fake UUID cookie, no Host header injection
  console.log("\n[Test 1] Testing fake UUID cookie without Host header injection...");
  await new Promise((resolve) => {
    const req1 = http.request({
      host: targetHost,
      port: targetPort,
      path: path,
      method: 'GET',
      headers: {
        'Cookie': `employee_auth=${fakeUUID}`
      }
    }, (res) => {
      console.log(`Status Code: ${res.statusCode}`);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`Response: ${data}`);
        if (res.statusCode !== 401) {
          console.log("-> ❌ Test 1 Failed: Auth bypass successful with just fake cookie!");
        } else {
          console.log("-> ✅ Test 1 Passed: Request blocked.");
        }
        resolve();
      });
    });
    req1.on('error', (e) => {
        console.error(`Request error: ${e.message}`);
        resolve();
    });
    req1.end();
  });

  // Test 2: Fake UUID cookie WITH Host header injection
  const fakeServerPort = 3001;
  let ssrfCaught = false;
  const fakeServer = http.createServer((req, res) => {
    console.log(`\n[!] Fake server received request to: ${req.url}`);
    ssrfCaught = true;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ user: { id: 'hacked' } }));
  });
  
  fakeServer.listen(fakeServerPort, async () => {
      console.log(`\nFake server listening on port ${fakeServerPort}`);

      console.log(`\n[Test 2] Testing fake UUID cookie WITH Host header injection (Host: 127.0.0.1:${fakeServerPort})...`);
      
      await new Promise((resolve) => {
        const req2 = http.request({
          host: targetHost,
          port: targetPort,
          path: path,
          method: 'GET',
          headers: {
            'Cookie': `employee_auth=${fakeUUID}`,
            'Host': `127.0.0.1:${fakeServerPort}` 
          }
        }, (res) => {
          console.log(`Status Code: ${res.statusCode}`);
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            console.log(`Response: ${data}`);
            
            if (ssrfCaught) {
                console.log("-> ❌ Test 2 Failed: SSRF occurred! Request sent to injected Host.");
            } else if (res.statusCode !== 401) {
              console.log("-> ❌ Test 2 Failed: Auth bypass successful, but no SSRF caught.");
            } else {
              console.log("-> ✅ Test 2 Passed: Request blocked, no SSRF.");
            }
            resolve();
          });
        });
        req2.on('error', (e) => {
            console.error(`Request error: ${e.message}`);
            resolve();
        });
        req2.end();
      });
      
      console.log(`\n[Test 3] Testing with 'host' header injection (lowercase)...`);
      ssrfCaught = false; // reset
      await new Promise((resolve) => {
        const req3 = http.request({
          host: targetHost,
          port: targetPort,
          path: path,
          method: 'GET',
          headers: {
            'Cookie': `employee_auth=${fakeUUID}`,
            'host': `127.0.0.1:${fakeServerPort}` 
          }
        }, (res) => {
          console.log(`Status Code: ${res.statusCode}`);
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            console.log(`Response: ${data}`);
            
            if (ssrfCaught) {
                console.log("-> ❌ Test 3 Failed: SSRF occurred! Request sent to injected host.");
            } else if (res.statusCode !== 401) {
              console.log("-> ❌ Test 3 Failed: Auth bypass successful, but no SSRF caught.");
            } else {
              console.log("-> ✅ Test 3 Passed: Request blocked, no SSRF.");
            }
            resolve();
          });
        });
        req3.on('error', (e) => {
            console.error(`Request error: ${e.message}`);
            resolve();
        });
        req3.end();
      });

      fakeServer.close();
      console.log("\n=== Tests Complete ===");
  });
}

runTests();
