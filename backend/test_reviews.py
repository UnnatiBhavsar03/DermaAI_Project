import sys
import os
import time
import requests

sys.path.append(os.getcwd())
from app import app
from models import db, User, SkinAnalysis, Recommendations, ProductReview

def run_test():
    with app.app_context():
        # 1. Create a dummy user
        u1 = User.query.filter_by(email="testr1@example.com").first()
        if not u1:
            u1 = User(name="Test Reviewer 1", email="testr1@example.com", password="pwd")
            db.session.add(u1)
            db.session.commit()
            
        # 2. Create a scan for user 1
        s1 = SkinAnalysis(user_id=u1.user_id, scan_type="Upload", image_path="dummy.jpg", is_sent=True, is_reviewed=True)
        db.session.add(s1)
        db.session.commit()
        
        # 3. Create a product recommendation for s1
        r1 = Recommendations(analysis_id=s1.analysis_id, type="Product", title="Mock Product Z", description="Test Description", model_version="1.0")
        db.session.add(r1)
        db.session.commit()
        
        print(f"User ID: {u1.user_id}, Scan ID: {s1.analysis_id}")
        
    time.sleep(1) # wait for flask context closure & server sync optionally since they query same DB

    # CHECK 1: Ensure can_review is true
    res = requests.get(f'http://localhost:5001/api/user/scan-details/{s1.analysis_id}').json()
    print("Before Review: ", [ (r['title'], r['can_review']) for r in res.get('recommendations', []) ])

    # CHECK 2: Post review
    res_post = requests.post('http://localhost:5001/api/user/product-review', json={
        "user_id": u1.user_id,
        "product_name": "Mock Product Z",
        "rating": 5,
        "review_text": "This is great!"
    }).json()
    print("Post Response: ", res_post)
    
    # CHECK 3: Ensure can_review is false and review appears
    res2 = requests.get(f'http://localhost:5001/api/user/scan-details/{s1.analysis_id}').json()
    print("After Review: ")
    for rec in res2.get('recommendations', []):
        if rec['title'] == "Mock Product Z":
            print(f"  can_review: {rec['can_review']}")
            print(f"  reviews count: {len(rec['reviews'])}")

if __name__ == "__main__":
    run_test()
