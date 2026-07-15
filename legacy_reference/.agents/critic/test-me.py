import urllib.request
import urllib.error

url = 'http://localhost:3015/api/auth/employee/me'
req = urllib.request.Request(url)
req.add_header('Cookie', 'employee_auth=123e4567-e89b-12d3-a456-426614174000')

try:
    res = urllib.request.urlopen(req)
    print(res.getcode())
    print(res.read())
except urllib.error.HTTPError as e:
    print(e.code)
    print(e.headers)
