const http = require('http');
const crypto = require('crypto');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const fakeUuid = crypto.randomUUID();
    const req = http.request(
      `http://localhost:3000${path}`,
      {
        headers: {
          cookie: `employee_auth=${fakeUuid}`
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          resolve({ status: res.statusCode, data, path, fakeUuid });
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('Testing authentication bypass with fake UUIDs...');
  
  const endpoints = [
    '/api/dashboard',
    '/api/generate-form',
    '/api/generate-doc'
  ];

  let anyBypassed = false;
  
  for (const endpoint of endpoints) {
    try {
      const result = await makeRequest(endpoint);
      console.log(`\nPath: ${result.path}`);
      console.log(`Fake UUID: ${result.fakeUuid}`);
      console.log(`Status Code: ${result.status}`);
      
      if (result.status === 200 || result.status !== 401) {
        console.log(`❌ FAIL: Successfully bypassed auth for ${result.path}!`);
        console.log(`Response snippet: ${result.data.substring(0, 100)}...`);
        anyBypassed = true;
      } else {
        console.log(`✅ PASS: Correctly blocked by auth (Status 401)`);
      }
    } catch (e) {
      console.error(`Error requesting ${endpoint}:`, e);
    }
  }

  if (anyBypassed) {
    console.log('\n❌ CHALLENGE FAILED: Auth bypass is still possible!');
  } else {
    console.log('\n✅ CHALLENGE PASSED: All tested endpoints blocked the fake UUID.');
  }
}

runTests();
