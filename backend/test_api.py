import urllib.request
import json
import sys

def test_endpoints():
    print("Testing API...")
    
    # Test 1: Health Check
    try:
        with urllib.request.urlopen('http://localhost:8000/') as response:
            print(f"Health Check: {response.status}")
            print(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Health Check Failed: {e}")

    # Test 2: Recommendation
    try:
        req = urllib.request.Request(
            'http://localhost:8000/api/recommend-scheme',
            data=json.dumps({"transcript": "I am a farmer", "scheme": "pm-kisan", "language": "en"}).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req) as response:
            print(f"Recommend Check: {response.status}")
            print(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Recommend Check Failed: {e}")

if __name__ == "__main__":
    test_endpoints()
