const http = require('http');

async function testBypassAuth() {
  const res = await fetch('http://localhost:3015/api/generate-form', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': 'employee_auth=hacker_id'
    },
    body: JSON.stringify({
      customerId: 'test-id',
      templateName: 'test-template.docx'
    })
  });
  console.log(`Bypass Auth Status: ${res.status}`);
  const text = await res.text();
  console.log(`Bypass Auth Response: ${text}`);
}

async function testDirTraversal() {
  const res = await fetch('http://localhost:3015/api/generate-form', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': 'employee_auth=hacker_id'
    },
    body: JSON.stringify({
      customerId: 'test-id',
      templateName: '../../../etc/passwd'
    })
  });
  console.log(`Dir Traversal Status: ${res.status}`);
  const text = await res.text();
  console.log(`Dir Traversal Response: ${text}`);
}

async function testJapaneseHeader() {
  const res = await fetch('http://localhost:3015/api/generate-form', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': 'employee_auth=hacker_id'
    },
    body: JSON.stringify({
      customerId: 'test-id',
      templateName: '年金申請書.docx'
    })
  });
  console.log(`Japanese Header Status: ${res.status}`);
  // Check headers
  console.log(`Headers:`, res.headers);
  try {
    const text = await res.text();
    console.log(`Japanese Header Response: ${text.substring(0, 50)}...`);
  } catch (e) {
    console.log(`Japanese Header Error: ${e.message}`);
  }
}

async function run() {
  try {
    await fetch('http://localhost:3015/api/generate-form', { method: 'GET' });
  } catch (e) {
    console.log("Server not running, please start it");
    return;
  }
  
  await testBypassAuth();
  await testDirTraversal();
  await testJapaneseHeader();
}

run();
