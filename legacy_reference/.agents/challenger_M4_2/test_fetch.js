async function run() {
  const req1 = await fetch('http://localhost:3000/api/generate-form', {
    method: 'POST',
    body: JSON.stringify({
      customerId: 'non-existent-id',
      templateName: '脱退一時金請求書.docx'
    }),
    headers: { 'Content-Type': 'application/json' }
  });
  console.log('Test 1 (invalid customer):', req1.status, await req1.text());
}
run();
