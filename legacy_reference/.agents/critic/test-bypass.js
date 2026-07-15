const http = require('http');

async function checkBypass() {
  const fakeUuid = '123e4567-e89b-12d3-a456-426614174000'; // Fake UUID
  const url = 'http://localhost:3000/api/dashboard';

  try {
    console.log(`Sending request to ${url} with fake employee_auth cookie: ${fakeUuid}`);
    
    const response = await fetch(url, {
      headers: {
        'Cookie': `employee_auth=${fakeUuid}`
      }
    });

    console.log(`Response Status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('SUCCESS: Auth bypass prevented. Received 401 Unauthorized.');
      process.exit(0);
    } else {
      console.log(`FAILURE: Auth bypass possible. Received status ${response.status}.`);
      console.log('Response Body:', await response.text());
      process.exit(1);
    }
  } catch (error) {
    if (error.cause && error.cause.code === 'ECONNREFUSED') {
       console.log('Server is not running. Please start the server.');
       process.exit(2);
    }
    console.error('Error during test:', error);
    process.exit(1);
  }
}

checkBypass();
