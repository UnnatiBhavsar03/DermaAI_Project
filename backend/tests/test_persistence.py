
import requests
import base64
import json
import os
from app import app, db, SkinAnalysis

# Configuration
BASE_URL = "http://localhost:5001"
IMG_PATH = "test_image.jpg" 

def create_dummy_image():
    # Create a dummy text file as image, or small binary
    with open(IMG_PATH, "wb") as f:
        f.write(base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==")) # 1x1 pixel red dot

def test_summary_persistence():
    print("--- Testing Summary Persistence ---")
    
    # 1. Create Image
    create_dummy_image()
    
    # 2. Upload and Analyze
    with open(IMG_PATH, 'rb') as img:
        files = {'image': img}
        data = {'user_id': '6'} 
        print("Sending request...")
        try:
            response = requests.post(f"{BASE_URL}/api/analyze-skin", files=files, data=data)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                analysis_id = result['result'].get('analysis_id')
                summary_from_api = result['result'].get('summary')
                
                print(f"Analysis ID: {analysis_id}")
                if summary_from_api:
                     print(f"API Summary: {summary_from_api[:50]}...")
                
                if not analysis_id:
                     print("FAILED: No analysis_id returned")
                     return

                # 3. Verify in DB directly
                with app.app_context():
                    scan = SkinAnalysis.query.get(analysis_id)
                    if scan:
                        if scan.summary:
                             print(f"DB Summary: {scan.summary[:50]}...")
                        
                        if scan.summary == summary_from_api:
                            print("SUCCESS: Summary matches between API and DB.")
                        else:
                            print("FAILED: Summary mismatch.")
                            print(f"API: {summary_from_api}")
                            print(f"DB:  {scan.summary}")
                    else:
                        print("FAILED: Scan not found in DB.")
            else:
                print(f"Request Failed: {response.text}")
                
        except Exception as e:
            print(f"Test Error: {e}")

if __name__ == "__main__":
    test_summary_persistence()
