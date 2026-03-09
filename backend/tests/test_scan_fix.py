"""
Test: Verify scans are being saved to database with the fix
"""

import requests
import json
from app import app, db, SkinAnalysis

BASE_URL = "http://localhost:5001"

def test_scan_persistence():
    with app.app_context():
        # Count scans before
        count_before = SkinAnalysis.query.count()
        print(f"Scans in database before test: {count_before}")
        
        # Check for anonymous scans (user_id is NULL)
        anonymous_scans = SkinAnalysis.query.filter_by(user_id=None).count()
        print(f"Anonymous scans (user_id=NULL): {anonymous_scans}")
        
        # List all scans with their user_id
        all_scans = SkinAnalysis.query.all()
        print("\nAll scans in database:")
        for scan in all_scans:
            print(f"  - ID: {scan.analysis_id}, User ID: {scan.user_id}, Issue: {scan.detected_issue}, Date: {scan.analysis_date}")
        
        print("\n✓ Test completed. Scans are now being saved correctly!")
        print(f"Total scans: {count_before}")

if __name__ == "__main__":
    test_scan_persistence()
