import requests
import time

BASE_URL = "http://localhost:5001"

def test_conditional_deletion():
    print("Testing Scan and History Deletion Conditions...")
    from app import app, db
    from models import User, SkinAnalysis, ComparisonHistory
    from datetime import datetime
    
    with app.app_context():
        # Setup Test User
        user = User(
            name="Cond Delete Tests",
            email=f"condtest_{time.time()}@example.com",
            password="pwd"
        )
        db.session.add(user)
        db.session.commit()
        user_id = user.user_id

        # 1. Unverified Scan -> Hard Delete
        scan_unverified = SkinAnalysis(
            user_id=user_id,
            scan_type="Upload",
            detected_issue="Test Unverified",
            summary="test",
            image_path="test.jpg",
            is_reviewed=False, # PENDING
            analysis_date=datetime.utcnow()
        )
        db.session.add(scan_unverified)
        db.session.commit()
        s_unv_id = scan_unverified.analysis_id
        
        # 2. Verified Scan -> Soft Delete
        scan_verified = SkinAnalysis(
            user_id=user_id,
            scan_type="Upload",
            detected_issue="Test Verified",
            summary="test",
            image_path="test.jpg",
            is_reviewed=True, # VERIFIED
            analysis_date=datetime.utcnow()
        )
        db.session.add(scan_verified)
        db.session.commit()
        s_ver_id = scan_verified.analysis_id

        # 3. Unapproved History -> Hard Delete
        hist_unapproved = ComparisonHistory(
            user_id=user_id,
            analysis_id=s_unv_id,
            comparison_summary="Unapproved",
            status="Improved",
            is_approved=False # PENDING
        )
        db.session.add(hist_unapproved)
        db.session.commit()
        h_unv_id = hist_unapproved.history_id

        # 4. Approved History -> Soft Delete
        hist_approved = ComparisonHistory(
            user_id=user_id,
            analysis_id=s_ver_id,
            comparison_summary="Approved",
            status="Improved",
            is_approved=True # VERIFIED
        )
        db.session.add(hist_approved)
        db.session.commit()
        h_ver_id = hist_approved.history_id

    # Test Deletions
    # A. Unverified Scan (Hard Delete)
    del_s_unv = requests.delete(f"{BASE_URL}/api/user/scan/{s_unv_id}?user_id={user_id}").json()
    if del_s_unv['status'] != 'success':
        print("DELETE UNVERIFIED SCAN FAILED:", del_s_unv)
    assert del_s_unv['status'] == 'success'
    
    # Verify Hard Delete -> Check DB!
    with app.app_context():
        # Using db query to confirm it's GONE from database completely
        check_unv_scan = SkinAnalysis.query.get(s_unv_id)
        assert check_unv_scan is None, "Unverified scan was NOT hard deleted!"

    # B. Verified Scan (Soft Delete)
    del_s_ver = requests.delete(f"{BASE_URL}/api/user/scan/{s_ver_id}?user_id={user_id}").json()
    assert del_s_ver['status'] == 'success'
    
    with app.app_context():
        check_ver_scan = SkinAnalysis.query.get(s_ver_id)
        assert check_ver_scan is not None, "Verified scan was HARD deleted instead of soft!"
        assert check_ver_scan.user_deleted == True, "Verified scan was not flagged user_deleted!"

    # C. Unapproved History (Hard Delete)
    with app.app_context():
        scan_unv2 = SkinAnalysis(user_id=user_id, scan_type="Upload", image_path="test2.jpg", is_reviewed=False)
        db.session.add(scan_unv2)
        db.session.commit()
        hist_unv2 = ComparisonHistory(user_id=user_id, analysis_id=scan_unv2.analysis_id, is_approved=False)
        db.session.add(hist_unv2)
        db.session.commit()
        h_unv_id = hist_unv2.history_id

    del_h_unv = requests.delete(f"{BASE_URL}/api/user/comparison-history/{h_unv_id}?user_id={user_id}").json()
    assert del_h_unv['status'] == 'success'

    with app.app_context():
        check_unv_hist = ComparisonHistory.query.get(h_unv_id)
        assert check_unv_hist is None, "Unapproved history was NOT hard deleted!"

    # D. Approved History (Soft Delete)
    del_h_ver = requests.delete(f"{BASE_URL}/api/user/comparison-history/{h_ver_id}?user_id={user_id}").json()
    assert del_h_ver['status'] == 'success'

    with app.app_context():
        check_ver_hist = ComparisonHistory.query.get(h_ver_id)
        assert check_ver_hist is not None, "Approved history was HARD deleted instead of soft!"
        assert check_ver_hist.user_deleted == True, "Approved history was not flagged user_deleted!"

    print("ALL TESTS PASSED: Conditional deletion working perfectly!")


if __name__ == '__main__':
    test_conditional_deletion()
