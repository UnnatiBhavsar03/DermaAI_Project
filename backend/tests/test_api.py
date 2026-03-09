
import requests
import json
import time

BASE_URL = "http://localhost:5000/api/admin"

def test_generate_routine():
    print("--- Testing Generate Routine ---")
    payload = {
        "issue": "Acne on forehead",
        "choice": "Remedy" # Field present in frontend, though backend might ignore it now
    }
    
    try:
        start_time = time.time()
        response = requests.post(f"{BASE_URL}/generate-routine", json=payload)
        end_time = time.time()
        
        print(f"Status Code: {response.status_code}")
        print(f"Time Taken: {end_time - start_time:.2f}s")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "success" and "routine" in data:
                print("SUCCESS: Routine generated.")
                print("Routine Data Type:", type(data["routine"]))
                print("Routine Keys:", data["routine"].keys() if isinstance(data["routine"], dict) else "Not a dict")
                # print(json.dumps(data["routine"], indent=2))
                return True
            else:
                print("FAILURE: Invalid response format.")
                print(data)
        else:
            print(f"FAILURE: API Error. {response.text}")
            
    except Exception as e:
        print(f"EXCEPTION: {e}")
    
    return False

def test_verify_route():
    print("\n--- Testing Verify Route Check ---")
    # This is harder to test without a valid analysis_id, but we can check if 404 is returned instead of 500 or 405
    # usage: /api/admin/verify-scan/<id>
    
    # Using a dummy ID
    dummy_id = 99999
    payload = {
        "recommendation": "Test Recommendation",
        "type": "Product"
    }
    
    try:
        response = requests.put(f"{BASE_URL}/verify-scan/{dummy_id}", json=payload)
        print(f"Status Code: {response.status_code}")
        
        # We expect 404 "Scan not found" OR 200 if we happen to hit a real ID. 
        # But we mostly want to ensure the ROUTE exists (so not 404 Not Found on the URL itself).
        # Actually Flask returns 404 for the URL if route matches but ID resource not found logic handles it? 
        # No, Flask 404s if url pattern matches.
        # Wait, if I request a route that doesn't exist, I get 404 HTML or JSON.
        # If I request a route that exists but resource is missing, my code returns JSON 404.
        
        if response.status_code == 404:
            data = response.json()
            if data.get("message") == "Scan not found":
                print("SUCCESS: Route exists (returned logical 404).")
            else:
                 print(f"UNCERTAIN: {response.text}")
        elif response.status_code == 200:
             print("SUCCESS: Route exists and verified.")
        else:
             print(f"FAILURE: Unexpected status code {response.status_code}")
             print(response.text)

    except Exception as e:
        print(f"EXCEPTION: {e}")

if __name__ == "__main__":
    if test_generate_routine():
        test_verify_route()
