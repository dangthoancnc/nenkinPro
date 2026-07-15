async function runTest() {
  const url = 'http://localhost:3015/api/generate-form';
  const cookie = 'employee_auth=ba76de17-3421-4545-9db7-73a5787f08e3';

  console.log('Testing ASCII template name...');
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie
      },
      body: JSON.stringify({
        customerId: '1719f334-f78e-4bfb-9fab-23898acaa94f',
        templateName: 'test.docx'
      })
    });
    console.log('Status:', res.status);
    if (!res.ok) {
      const err = await res.text();
      console.log('Error:', err);
    } else {
      console.log('Success! Headers:', res.headers.get('content-disposition'));
    }
  } catch (e) {
    console.log('Exception:', e);
  }
}

runTest();
