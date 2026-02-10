import os
from google import genai  # Newer library as suggested by your terminal
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from sqlalchemy import func
from models import db, Admin, User, SkinAnalysis, Recommendations
from datetime import date

# 1. Load environment variables
load_dotenv()

# 2. Setup Gemini AI (Newer SDK)
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

app = Flask(__name__)

# 3. Robust CORS Configuration
CORS(app, resources={r"/api/*": {"origins": "*"}}, methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# 4. Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# ==========================================================
# --- 1. ADMIN AUTHENTICATION ---
# ==========================================================
@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.json
    admin = Admin.query.filter_by(email=data.get('username'), password=data.get('password')).first()
    if admin:
        return jsonify({"status": "success", "user": admin.name, "admin_id": admin.admin_id}), 200
    return jsonify({"status": "error", "message": "Invalid credentials"}), 401

# ==========================================================
# --- 2. DASHBOARD DATA ---
# ==========================================================
@app.route('/api/admin/dashboard-data', methods=['GET'])
def get_dashboard_data():
    try:
        db.session.commit()
        today = date.today()
        stats = {
            "total_users": User.query.count(),
            "total_scans": SkinAnalysis.query.count(),
            "pending_reviews": SkinAnalysis.query.filter_by(is_reviewed=False).count(),
            "todays_scans": SkinAnalysis.query.filter(func.date(SkinAnalysis.analysis_date) == today).count()
        }
        skin_type_query = db.session.query(User.skin_type, func.count(User.user_id)).group_by(User.skin_type).all()
        issue_query = db.session.query(SkinAnalysis.detected_issue, func.count(SkinAnalysis.analysis_id)).group_by(SkinAnalysis.detected_issue).all()
        
        return jsonify({
            "status": "success",
            "stats": stats,
            "charts": {
                "skinTypes": [{"name": r[0] or "Other", "value": r[1]} for r in skin_type_query],
                "skinIssues": [{"name": r[0], "count": r[1]} for r in issue_query]
            }
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# ==========================================================
# --- 3. MANAGE SKIN ANALYSIS ---
# ==========================================================
@app.route('/api/admin/all-scans', methods=['GET'])
def get_all_scans():
    try:
        db.session.commit()
        scans = SkinAnalysis.query.order_by(SkinAnalysis.analysis_date.desc()).all()
        output = [{
            "analysis_id": s.analysis_id,
            "detected_issue": s.detected_issue,
            "scan_type": s.scan_type,
            "confidence_score": s.confidence_score,
            "is_reviewed": s.is_reviewed,
            "image_path": s.image_path,
            "analysis_date": s.analysis_date.isoformat()
        } for s in scans]
        return jsonify({"status": "success", "scans": output}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/admin/delete-scan/<int:analysis_id>', methods=['DELETE'])
def delete_scan(analysis_id):
    try:
        scan = SkinAnalysis.query.get(analysis_id)
        if not scan: return jsonify({"status": "error", "message": "Not found"}), 404
        db.session.delete(scan)
        db.session.commit()
        return jsonify({"status": "success", "message": "Deleted"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

# ==========================================================
# --- 4. GEMINI AI & RECOMMENDATIONS ---
# ==========================================================
@app.route('/api/admin/generate-routine', methods=['POST'])
def generate_routine():
    try:
        data = request.json
        if not data:
            return jsonify({"status": "error", "message": "No data received"}), 400
            
        issue = data.get('issue')
        # choice is no longer strictly needed if we ask for everything, 
        # but we can keep it if we want to focus generation. 
        # For this requirement, we want EVERYTHING (Products + Remedies).

        if not issue:
            return jsonify({"status": "error", "message": "Skin issue description is missing"}), 400

        print(f"--- Calling Gemini for: {issue} ---")

        # Updated Prompt for JSON Structure
        prompt = f"""
        As a professional dermatologist assistant, verify the detected issue "{issue}" and provide a skincare routine.
        Return ONLY a valid JSON object with the following structure. Do not wrap it in markdown code blocks.
        {{
            "routine_summary": "A brief overview of the daily routine (under 50 words).",
            "products": [
                {{
                    "title": "Product Name/Type",
                    "description": "How to use this product for {issue}.",
                    "type": "Product"
                }},
                ... (3-4 items)
            ],
            "remedies": [
                {{
                    "title": "Remedy Name",
                    "description": "Ingredients and instructions for {issue}.",
                    "type": "Remedy"
                }},
                ... (2-3 items)
            ]
        }}
        """

        response = client.models.generate_content(
            model="models/gemini-1.5-flash",
            contents=prompt,
             config={
                'response_mime_type': 'application/json'
            }
        )

        if not response or not response.text:
            return jsonify({"status": "error", "message": "Gemini returned an empty response"}), 500

        # Attempt to parse JSON just to be safe, though response_mime_type helps
        import json
        try:
            routine_data = json.loads(response.text)
        except json.JSONDecodeError:
            # Fallback cleanup if needed (rare with mime_type set)
            clean_text = response.text.replace('```json', '').replace('```', '').strip()
            routine_data = json.loads(clean_text)

        return jsonify({"status": "success", "routine": routine_data}), 200

    except Exception as e:
        print(f"!!! GEMINI CRASH: {str(e)}") 
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/admin/verify-scan-batch/<int:analysis_id>', methods=['POST'])
def verify_scan_batch(analysis_id):
    try:
        data = request.json # Expects { "recommendations": [...] }
        scan = SkinAnalysis.query.get(analysis_id)
        if not scan: return jsonify({"status": "error", "message": "Scan not found"}), 404
        
        scan.is_reviewed = True
        
        recommendations = data.get('recommendations', [])
        
        for rec in recommendations:
            new_rec = Recommendations(
                analysis_id=analysis_id,
                type=rec.get('type', 'Remedy'), # Default to Remedy
                model_version='Gemini-1.5-Flash',
                title=rec.get('title', 'Expert Advice'),
                description=rec.get('description', ''),
                link=rec.get('link', ''), 
                admin_status='Verified'
            )
            db.session.add(new_rec)
        
        db.session.commit()
        return jsonify({"status": "success", "message": "Batch verified successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

# ==========================================================
# --- 5. IMAGE SERVING ---
# ==========================================================
@app.route('/uploads/<path:filename>')
def serve_image(filename):
    root_dir = os.path.dirname(os.path.abspath(__file__))
    uploads_path = os.path.join(root_dir, 'uploads')
    return send_from_directory(uploads_path, filename)

if __name__ == '__main__':
    app.run(debug=True, port=5000)