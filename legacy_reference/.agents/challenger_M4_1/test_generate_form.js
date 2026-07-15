const fetch = require('node-fetch');

async function runTests() {
  const url = 'http://localhost:3000/api/generate-form';
  console.log('--- Testing API generate-form ---');

  // Test 1: Malformed JSON
  console.log('\\n1. Testing malformed JSON payload');
  try {
    const res1 = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ invalid_json'
    });
    console.log('Status:', res1.status);
    const text1 = await res1.text();
    console.log('Body:', text1);
  } catch (e) {
    console.log('Error:', e);
  }

  // Test 2: Missing customerId
  console.log('\\n2. Testing missing customerId');
  try {
    const res2 = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateName: 'test.docx' })
    });
    console.log('Status:', res2.status);
    const json2 = await res2.json();
    console.log('Body:', json2);
  } catch (e) {
    console.log('Error:', e);
  }

  // Test 3: Missing templateName
  console.log('\\n3. Testing missing templateName');
  try {
    const res3 = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: 'some-id' })
    });
    console.log('Status:', res3.status);
    const json3 = await res3.json();
    console.log('Body:', json3);
  } catch (e) {
    console.log('Error:', e);
  }
}

runTests();
