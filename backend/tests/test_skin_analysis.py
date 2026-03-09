
import requests
import io
import base64

BASE_URL = "http://localhost:5001/api"

# Small valid white JPEG encoded in base64
DUMMY_JPEG_B64 = "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBNNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q=="

def create_dummy_image():
    return base64.b64decode(DUMMY_JPEG_B64)

def test_skin_analysis():
    print("--- Testing Skin Analysis Endpoint ---")
    
    # 1. Create Dummy Image
    print("1. Creating dummy image (base64)...")
    img_data = create_dummy_image()
    
    # 2. Upload to Endpoint
    print("2. Sending image to /api/analyze-skin...")
    try:
        files = {'image': ('test_skin.jpg', img_data, 'image/jpeg')}
        # Optional: Add user_id if needed
        # data = {'user_id': 1} 
        
        response = requests.post(f"{BASE_URL}/analyze-skin", files=files)
        
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text}")
        
        if response.status_code == 200:
            print("   SUCCESS! AI Analysis received.")
        else:
            print("   FAILURE. Check server logs.")
            
    except Exception as e:
        print(f"   Error: {e}")

if __name__ == "__main__":
    test_skin_analysis()
