import requests
import time

BASE_URL = "http://localhost:5001"

def test_admin_delete_fix():
    print("Testing Admin Scan Deletion Fallbacks...")
    from app import app, db
    from models import User, SkinAnalysis, ComparisonHistory
    from datetime import datetime
    
    with app.app_context():
        # Setup Test User
        user = User(
            name="Admin Delete Tests",
            email=f"admintest_{time.time()}@example.com",
            password="pwd"
        )
        db.session.add(user)
        db.session.commit()
        user_id = user.user_id

        # 1. Scan with NO references
        scan_no_ref = SkinAnalysis(
            user_id=user_id,
            scan_type="Upload",
            detected_issue="Test No Ref",
            image_path="test.jpg"
        )
        db.session.add(scan_no_ref)
        db.session.commit()
        s_no_ref_id = scan_no_ref.analysis_id

        # 2. Scan WITH reference
        scan_with_ref = SkinAnalysis(
            user_id=user_id,
            scan_type="Upload",
            detected_issue="Test With Ref",
            image_path="test.jpg"
        )
        db.session.add(scan_with_ref)
        db.session.commit()
        s_with_ref_id = scan_with_ref.analysis_id

        hist_ref = ComparisonHistory(
            user_id=user_id,
            analysis_id=s_with_ref_id,
            comparison_summary="Linked to scan",
            status="Improved",
            is_approved=True
        )
        db.session.add(hist_ref)
        db.session.commit()

    # -- TEST ADMIN DELETE --
    
    # A. Delete Scan NO REF -> Should Hard Delete
    res_no = requests.delete(f"{BASE_URL}/api/admin/delete-scan/{s_no_ref_id}").json()
    assert res_no['status'] == 'success'
    
    with app.app_context():
        check_no = SkinAnalysis.query.get(s_no_ref_id)
        assert check_no is None, "Scan with no references was NOT hard deleted!"

    # B. Delete Scan WITH REF -> Should Soft Delete
    res_with = requests.delete(f"{BASE_URL}/api/admin/delete-scan/{s_with_ref_id}").json()
    assert res_with['status'] == 'success'
    
    with app.app_context():
        check_with = SkinAnalysis.query.get(s_with_ref_id)
        assert check_with is not None, "Scan with references WAS hard deleted incorrectly!"
        assert check_with.is_deleted == True, "Scan with references was NOT soft deleted!"

    print("ALL TESTS PASSED: Admin deletion functioning safely and conditionally!")

if __name__ == '__main__':
    test_admin_delete_fix()
