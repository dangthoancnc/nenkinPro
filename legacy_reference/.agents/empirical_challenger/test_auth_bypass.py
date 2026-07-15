import http.client

def test_host_header_injection():
    # Use port 3015 since that's what the dev script uses
    conn = http.client.HTTPConnection("127.0.0.1", 3015)
    
    # Try to access a protected endpoint
    # Send a forged Host header and a fake employee_auth cookie
    headers = {
        "Host": "attacker.com",
        "Cookie": "employee_auth=123e4567-e89b-12d3-a456-426614174000"
    }
    
    print("Testing Host header injection with fake UUID cookie on port 3015...")
    try:
        conn.request("GET", "/api/generate-form", headers=headers)
        response = conn.getresponse()
        
        status = response.status
        body = response.read().decode('utf-8')
        
        print(f"Status: {status}")
        print(f"Body: {body[:200]}")
        
        if status == 200:
            print("FAIL: Successfully bypassed auth with Host header injection!")
        elif status == 401:
            print("PASS: Auth correctly blocked the request (401).")
        else:
            print(f"UNKNOWN: Received status {status}")
            
    except Exception as e:
        print(f"Error during request: {e}")
        
    conn.close()

if __name__ == "__main__":
    test_host_header_injection()
