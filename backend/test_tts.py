import requests
import time

# Wait for server to start
print("Waiting for server...")
time.sleep(3)

try:
    url = "http://localhost:8000/api/speak"
    payload = {"text": "Hello, this is a test.", "language": "en-IN"}
    
    print(f"Sending request to {url}...")
    response = requests.post(url, json=payload)
    
    if response.status_code == 200:
        content_type = response.headers.get("content-type")
        content_length = len(response.content)
        print(f"✅ Success! Received {content_length} bytes.")
        print(f"   Content-Type: {content_type}")
        if content_length > 1000 and "audio" in content_type:
             print("   Result looks like valid audio.")
        else:
             print("   ⚠️ Warning: Response might be empty or invalid.")
    else:
        print(f"❌ Failed. Status: {response.status_code}")
        print(f"   Error: {response.text}")

except Exception as e:
    print(f"❌ Connection Error: {e}")
    print("   Make sure backend/main.py is running.")
