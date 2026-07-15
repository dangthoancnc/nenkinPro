import { POST } from '../../../../src/app/api/generate-form/route';

async function run() {
  const req = new Request('http://localhost:3000/api/generate-form', {
    method: 'POST',
    body: JSON.stringify({
      customerId: 'some-non-existent-id',
      templateName: 'test.docx'
    }),
    headers: { 'Content-Type': 'application/json' }
  });

  const res = await POST(req);
  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Response:', data);
}

run().catch(console.error);
