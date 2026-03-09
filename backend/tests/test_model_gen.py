
import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

def test_model(model_name):
    print(f"Testing model: {model_name}...")
    try:
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        response = client.models.generate_content(
            model=model_name,
            contents="Say hello.",
            config=None
        )
        print(f"   SUCCESS! Response: {response.text}")
        return True
    except Exception as e:
        print(f"   FAILED: {e}")
        return False

if __name__ == "__main__":
    models_to_test = [
        "gemini-1.5-flash",
        "models/gemini-1.5-flash",
        "gemini-1.5-flash-001",
        "gemini-flash-latest",
        "gemini-2.0-flash-exp"
    ]
    
    for m in models_to_test:
        if test_model(m):
            print(f"--- FOUND WORKING MODEL: {m} ---")
            break
