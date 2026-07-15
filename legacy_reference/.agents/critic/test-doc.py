import urllib.request
import urllib.error

url = 'http://localhost:3015/api/generate-doc'
req = urllib.request.Request(url, method='POST', data=b'{"customerId":"123","templateName":"test.docx"}')
req.add_header('Cookie', 'employee_auth=123e4567-e89b-12d3-a456-426614174000')
req.add_header('Content-Type', 'application/json')

try:
    res = urllib.request.urlopen(req)
    print(res.getcode())
    print(res.read())
except urllib.error.HTTPError as e:
    print(e.code)
    print(e.headers)
