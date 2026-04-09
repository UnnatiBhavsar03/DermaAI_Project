import os
from google import genai 
from groq import Groq # Import Groq
from flask import Flask, request, jsonify, send_from_directory, make_response
from flask_cors import CORS
from dotenv import load_dotenv
from sqlalchemy import func
from models import db, Admin, User, SkinAnalysis, Recommendations, ProductReview, Session, ComparisonHistory
from datetime import date, datetime, timedelta
import json
import base64

# 1. Load environment variables
load_dotenv()

# 2. Setup AI Clients
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

app = Flask(__name__)

# 3. Robust CORS Configuration
CORS(app, resources={r"/api/*": {"origins": "*"}}, methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# 4. Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)
from flask_migrate import Migrate
migrate = Migrate(app, db)

from werkzeug.security import generate_password_hash, check_password_hash

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
# --- 1.5 USER AUTHENTICATION ---
# ==========================================================
@app.route('/api/user/register', methods=['POST'])
def user_register():
    try:
        data = request.json
        
        # Check if user already exists
        if User.query.filter_by(email=data.get('email')).first():
            return jsonify({"status": "error", "message": "Email already registered"}), 400

        hashed_password = generate_password_hash(data.get('password'))
        
        allergies_data = data.get('allergies', [])
        allergies_str = json.dumps(allergies_data) if isinstance(allergies_data, list) else allergies_data

        new_user = User(
            name=data.get('name'),
            email=data.get('email'),
            password=hashed_password,
            birth_date=data.get('birth_date'),
            gender=data.get('gender'),
            skin_type=data.get('skin_type'),
            allergies=allergies_str
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({"status": "success", "message": "User registered successfully"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/user/login', methods=['POST'])
def user_login():
    try:
        data = request.json
        user = User.query.filter(User.email == data.get('email'), (User.is_deleted == False) | (User.is_deleted == None)).first()
        
        if user and check_password_hash(user.password, data.get('password')):
            
            # Invalidate previous active sessions for this user
            active_sessions = Session.query.filter_by(user_id=user.user_id, session_status='active').all()
            for s in active_sessions:
                s.session_status = 'expired'
            
            ip_addr = request.remote_addr
            user_agent = request.headers.get('User-Agent', 'Unknown')[:255]
            
            new_session = Session(
                user_id=user.user_id,
                ip_address=ip_addr,
                device_info=user_agent,
                session_status='active'
            )
            db.session.add(new_session)
            db.session.commit()
            
            remember_me = data.get('remember_me', False)
            expiry_time = timedelta(days=7) if remember_me else timedelta(hours=1)
            
            response = make_response(jsonify({
                "status": "success", 
                "message": "Login successful",
                "user": {
                    "user_id": user.user_id,
                    "name": user.name,
                    "email": user.email,
                    "skin_type": user.skin_type,
                    "created_at": user.created_at.isoformat() if user.created_at else None
                }
            }))
            
            response.set_cookie(
                'session_token', 
                new_session.session_id, 
                httponly=True,
                samesite='Lax', 
                max_age=int(expiry_time.total_seconds()) 
            )
            return response, 200
            
        return jsonify({"status": "error", "message": "Invalid email or password"}), 401
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/user/logout', methods=['POST'])
def secure_logout():
    session_token = request.cookies.get('session_token')
    
    if session_token:
        # Mark session as expired in DB
        session_record = Session.query.filter_by(session_id=session_token).first()
        if session_record:
            session_record.session_status = 'expired'
            db.session.commit()
            
    response = make_response(jsonify({"status": "success", "message": "Logged out successfully"}))
    response.delete_cookie('session_token') 
    return response, 200

from functools import wraps

def session_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        session_token = request.cookies.get('session_token')
        
        if not session_token:
            return jsonify({"status": "error", "message": "Authentication required"}), 401
            
        session_record = Session.query.filter_by(
            session_id=session_token, 
            session_status='active'
        ).first()
        
        if not session_record:
            return jsonify({"status": "error", "message": "Invalid or expired session"}), 401
            
        # Security Check: Did the IP address change dramatically? Optional.
        # if session_record.ip_address != request.remote_addr: ...
            
        time_since_last_activity = datetime.utcnow() - session_record.last_activity
        if time_since_last_activity > timedelta(minutes=30):
            session_record.session_status = 'expired'
            db.session.commit()
            response = make_response(jsonify({"status": "error", "message": "Session timed out"}))
            response.delete_cookie('session_token')
            return response, 401
            
        session_record.last_activity = datetime.utcnow()
        db.session.commit()
        
        request.current_user = session_record.user
        
        return f(*args, **kwargs)
    return decorated_function


# ==========================================================
# --- 2. DASHBOARD DATA ---
# ==========================================================
@app.route('/api/admin/dashboard-data', methods=['GET'])
def get_dashboard_data():
    try:
        db.session.commit()
        today = date.today()
        stats = {
            "total_users": User.query.filter((User.is_deleted == False) | (User.is_deleted == None)).count(),
            "total_scans": SkinAnalysis.query.filter_by(is_deleted=False).count(),
            "pending_reviews": SkinAnalysis.query.filter_by(is_reviewed=False, is_deleted=False).count(),
            "todays_scans": SkinAnalysis.query.filter(SkinAnalysis.is_deleted==False, func.date(SkinAnalysis.analysis_date) == today).count()
        }
        # Skin Type Distribution
        skin_type_query = db.session.query(User.skin_type, func.count(User.user_id)).filter((User.is_deleted == False) | (User.is_deleted == None)).group_by(User.skin_type).all()
        
        # User Growth Logic based on Range
        time_range = request.args.get('range', 'week') # week, month, year
        user_growth_data = []
        
        if time_range == 'month':
            # Last 30 days
            start_date = datetime.utcnow() - timedelta(days=30)
            daily_users = db.session.query(
                func.date(User.created_at).label('date'), 
                func.count(User.user_id)
            ).filter(User.created_at >= start_date, (User.is_deleted == False) | (User.is_deleted == None)).group_by(func.date(User.created_at)).all()
            
            growth_map = {str(day): count for day, count in daily_users}
            # Sample every 5 days to avoid crowding
            for i in range(0, 31, 5): 
                d = (start_date + timedelta(days=i)).date()
                d_str = str(d)
                user_growth_data.append({
                    "day": d.strftime("%d %b"),
                    "users": growth_map.get(d_str, 0)
                })

        elif time_range == 'year':
            # Last 12 months
            start_date = datetime.utcnow() - timedelta(days=365)
            # SQLite specific for year-month extraction: 'YYYY-MM'
            monthly_users = db.session.query(
                func.strftime('%Y-%m', User.created_at).label('month'), 
                func.count(User.user_id)
            ).filter(User.created_at >= start_date, (User.is_deleted == False) | (User.is_deleted == None)).group_by(func.strftime('%Y-%m', User.created_at)).all()
            
            growth_map = {month: count for month, count in monthly_users}
            
            # Generate 12 months data
            curr = start_date
            for _ in range(12):
                m_str = curr.strftime("%Y-%m")
                user_growth_data.append({
                    "day": curr.strftime("%b"), 
                    "users": growth_map.get(m_str, 0)
                })
                # Increment month safely
                if curr.month == 12:
                    curr = curr.replace(year=curr.year + 1, month=1)
                else:
                    curr = curr.replace(month=curr.month + 1)
        
        else: # Default: week
            seven_days_ago = datetime.utcnow() - timedelta(days=6)
            daily_users = db.session.query(
                func.date(User.created_at).label('date'), 
                func.count(User.user_id)
            ).filter(User.created_at >= seven_days_ago, (User.is_deleted == False) | (User.is_deleted == None)).group_by(func.date(User.created_at)).all()
            
            growth_map = {str(day): count for day, count in daily_users}
            for i in range(7):
                d = (seven_days_ago + timedelta(days=i)).date()
                d_str = str(d)
                user_growth_data.append({
                    "day": d.strftime("%a"), 
                    "users": growth_map.get(d_str, 0)
                })

        # Recent Users (Top 5)
        recent_users_query = User.query.filter((User.is_deleted == False) | (User.is_deleted == None)).order_by(User.created_at.desc()).limit(5).all()
        recent_users_data = [{
            "id": u.user_id,
            "name": u.name,
            "email": u.email,
            "skin_type": u.skin_type,
            "joined": u.created_at.strftime("%d %b, %Y") if u.created_at else "N/A"
        } for u in recent_users_query]

        return jsonify({
            "status": "success",
            "stats": stats,
            "charts": {
                "skinTypes": [{"name": r[0] or "Unknown", "value": r[1]} for r in skin_type_query],
                "userGrowth": user_growth_data
            },
            "recent_users": recent_users_data
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
        scans = SkinAnalysis.query.filter_by(is_deleted=False).order_by(SkinAnalysis.analysis_date.desc()).all()
        output = []
        for s in scans:
            user_allergies = []
            if s.user and s.user.allergies:
                try:
                    user_allergies = json.loads(s.user.allergies)
                except:
                    user_allergies = [s.user.allergies]

            # Derive is_flagged from recommendations
            is_flagged = Recommendations.query.filter_by(
                analysis_id=s.analysis_id, admin_status='Flagged'
            ).first() is not None

            previous_image_path = None
            if s.scan_type == "Progress Report":
                ch = ComparisonHistory.query.filter_by(analysis_id=s.analysis_id).first()
                if ch and ch.previous_analysis_id:
                    prev_scan = SkinAnalysis.query.get(ch.previous_analysis_id)
                    if prev_scan:
                        previous_image_path = prev_scan.image_path

            output.append({
                "analysis_id": s.analysis_id,
                "detected_issue": s.detected_issue,
                "summary": s.summary,
                "scan_type": s.scan_type,
                "confidence_score": s.confidence_score,
                "is_reviewed": s.is_reviewed,
                "is_sent": s.is_sent,
                "is_flagged": is_flagged,
                "image_path": s.image_path,
                "previous_image_path": previous_image_path,
                "analysis_date": s.analysis_date.isoformat(),
                "user_id": s.user.user_id if s.user else None,
                "user_name": s.user.name if s.user else "Anonymous",
                "user_email": s.user.email if s.user else "N/A",
                "user_allergies": user_allergies
            })
        return jsonify({"status": "success", "scans": output}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/admin/users', methods=['GET'])
def get_all_users():
    try:
        db.session.commit()
        users = User.query.filter((User.is_deleted == False) | (User.is_deleted == None)).order_by(User.user_id.desc()).all()
        output = []
        for u in users:
            parsed_allergies = []
            if u.allergies:
                try:
                    parsed_allergies = json.loads(u.allergies)
                except:
                    parsed_allergies = [u.allergies]

            output.append({
                "user_id": u.user_id,
                "name": u.name,
                "email": u.email,
                "birth_date": u.birth_date.isoformat() if u.birth_date else None,
                "gender": u.gender,
                "skin_type": u.skin_type,
                "allergies": parsed_allergies,
                "created_at": u.created_at.isoformat() if u.created_at else None
            })
        return jsonify({"status": "success", "users": output}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/admin/user/<int:user_id>/scans', methods=['GET'])
def get_user_scans_admin(user_id):
    try:
        scans = SkinAnalysis.query.filter_by(user_id=user_id).order_by(SkinAnalysis.analysis_date.desc()).all()
        output = [{
            "analysis_id": s.analysis_id,
            "detected_issue": s.detected_issue,
            "summary": s.summary,
            "confidence_score": s.confidence_score,
            "is_reviewed": s.is_reviewed,
            "image_path": s.image_path,
            "analysis_date": s.analysis_date.isoformat(),
            "scan_type": s.scan_type
        } for s in scans]
        return jsonify({"status": "success", "scans": output}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/user/<int:user_id>/change-password', methods=['PUT'])
def change_password(user_id):
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({"status": "error", "message": "User not found"}), 404
        
        data = request.json
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not check_password_hash(user.password, current_password):
            return jsonify({"status": "error", "message": "Incorrect current password"}), 400
            
        user.password = generate_password_hash(new_password)
        db.session.commit()
        return jsonify({"status": "success", "message": "Password updated successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/user/<int:user_id>/deactivate', methods=['POST'])
def deactivate_account(user_id):
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({"status": "error", "message": "User not found"}), 404

        has_linked_records = SkinAnalysis.query.filter_by(user_id=user_id).first() or ComparisonHistory.query.filter_by(user_id=user_id).first()
        
        if has_linked_records:
            user.is_deleted = True
            db.session.commit()
            return jsonify({"status": "success", "message": "Account deactivated (soft-deleted)"}), 200

        # Delete child records in dependency order to satisfy FK constraints
        Session.query.filter_by(user_id=user_id).delete(synchronize_session=False)
        ProductReview.query.filter_by(user_id=user_id).delete(synchronize_session=False)

        db.session.delete(user)
        db.session.commit()
        return jsonify({"status": "success", "message": "Account deactivated"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/admin/user/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({"status": "error", "message": "User not found"}), 404

        has_linked_records = SkinAnalysis.query.filter_by(user_id=user_id).first() or ComparisonHistory.query.filter_by(user_id=user_id).first()
        
        if has_linked_records:
            user.is_deleted = True
            db.session.commit()
            return jsonify({"status": "success", "message": "User soft-deleted successfully due to linked records"}), 200

        # Delete child records in dependency order to satisfy FK constraints
        Session.query.filter_by(user_id=user_id).delete(synchronize_session=False)
        ProductReview.query.filter_by(user_id=user_id).delete(synchronize_session=False)

        db.session.delete(user)
        db.session.commit()
        return jsonify({"status": "success", "message": "User deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/admin/users/delete-batch', methods=['POST'])
def delete_users_batch():
    try:
        data = request.json
        user_ids = data.get('user_ids', [])
        
        if not user_ids:
             return jsonify({"status": "error", "message": "No users selected"}), 400

        for uid in user_ids:
            user = User.query.get(uid)
            if user:
                has_linked = SkinAnalysis.query.filter_by(user_id=uid).first() or ComparisonHistory.query.filter_by(user_id=uid).first()
                if has_linked:
                    user.is_deleted = True
                else:
                    Session.query.filter_by(user_id=uid).delete(synchronize_session=False)
                    ProductReview.query.filter_by(user_id=uid).delete(synchronize_session=False)
                    db.session.delete(user)
        
        db.session.commit()
        
        return jsonify({"status": "success", "message": f"{len(user_ids)} users processed successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/admin/user/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({"status": "error", "message": "User not found"}), 404
        
        data = request.json
        old_email = user.email
        email_changed = False
        other_changed = False
        
        if 'name' in data and data['name'] != user.name:
            user.name = data['name']
            other_changed = True
            
        if 'email' in data and data['email'] != user.email:
            user.email = data['email']
            email_changed = True
            
        if 'skin_type' in data and data['skin_type'] != user.skin_type:
            user.skin_type = data['skin_type']
            other_changed = True
            
        if 'gender' in data and data['gender'] != user.gender:
            user.gender = data['gender']
            other_changed = True
            
        if 'allergies' in data: 
            allergies_data = data['allergies']
            new_al = json.dumps(allergies_data) if isinstance(allergies_data, list) else allergies_data
            if new_al != user.allergies:
                user.allergies = new_al
                other_changed = True
        
        if 'birth_date' in data:
            if data['birth_date']: # not empty string
                try:
                    new_date = datetime.strptime(data['birth_date'], '%Y-%m-%d').date()
                    if new_date != user.birth_date:
                        user.birth_date = new_date
                        other_changed = True
                except ValueError:
                    return jsonify({"status": "error", "message": "Invalid date format. Use YYYY-MM-DD"}), 400
            else:
                if user.birth_date is not None:
                    user.birth_date = None
                    other_changed = True
        
        db.session.commit()
        
        # Dispatch Emails securely using built-in smtplib
        if email_changed:
            send_email(
                user.email,
                "Your Account Email Has Been Updated",
                f"Hello {user.name},\n\nYour DermaAI account email has been successfully updated to this new address by an administrator.\n\nIf you did not expect this change, please contact support immediately."
            )
            
        if other_changed:
            target_email = user.email if email_changed else old_email
            send_email(
                target_email,
                "Your Account Details Have Been Updated",
                f"Hello {user.name},\n\nAn administrator has successfully updated your personal details (such as your name, skin profile, or demographic info) on your DermaAI account.\n\nYou can review these changes by logging into your profile.\n\nIf you did not expect this change, please contact support."
            )

        return jsonify({"status": "success", "message": "User updated successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

# ==========================================================
# --- ADMIN PROFILE ---
# ==========================================================
@app.route('/api/admin/<int:admin_id>', methods=['GET'])
def get_admin_profile(admin_id):
    try:
        admin = Admin.query.get(admin_id)
        if not admin:
            return jsonify({"status": "error", "message": "Admin not found"}), 404
            
        return jsonify({
            "status": "success",
            "admin": {
                "id": admin.admin_id,
                "name": admin.name,
                "email": admin.email
            }
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/admin/<int:admin_id>', methods=['PUT'])
def update_admin_profile(admin_id):
    try:
        admin = Admin.query.get(admin_id)
        if not admin:
            return jsonify({"status": "error", "message": "Admin not found"}), 404
            
        data = request.json
        if 'name' in data: admin.name = data['name']
        if 'email' in data: admin.email = data['email']
        
        # Password update (optional)
        if 'password' in data and data['password']:
            admin.password = generate_password_hash(data['password'])

        db.session.commit()
        return jsonify({"status": "success", "message": "Profile updated successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/admin/delete-scan/<int:analysis_id>', methods=['DELETE'])
def delete_scan(analysis_id):
    try:
        scan = SkinAnalysis.query.get(analysis_id)
        if not scan:
            return jsonify({"status": "error", "message": "Not found"}), 404
        # Check if linked to comparison history
        linked_history = ComparisonHistory.query.filter(
            (ComparisonHistory.analysis_id == analysis_id) | 
            (ComparisonHistory.previous_analysis_id == analysis_id)
        ).first()

        if linked_history:
            scan.is_deleted = True
            db.session.commit()
            return jsonify({"status": "success", "message": "Scan soft-deleted successfully due to linked comparison history"}), 200
        else:
            # Delete linked recommendations first to satisfy FK constraint
            Recommendations.query.filter_by(analysis_id=analysis_id).delete(synchronize_session=False)
            db.session.delete(scan)
            db.session.commit()
            return jsonify({"status": "success", "message": "Deleted"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/admin/flag-scan/<int:analysis_id>', methods=['POST'])
def flag_scan(analysis_id):
    try:
        scan = SkinAnalysis.query.get(analysis_id)
        if not scan:
            return jsonify({"status": "error", "message": "Scan not found"}), 404

        # Mark scan as reviewed but NOT sent (flagged scans are never sent)
        scan.is_reviewed = True
        scan.is_sent = False  # Ensure it can never be sent

        # Flag all existing recommendations for this scan
        existing_recs = Recommendations.query.filter_by(analysis_id=analysis_id).all()
        if existing_recs:
            for rec in existing_recs:
                rec.admin_status = 'Flagged'
        else:
            # No recommendations yet — create a placeholder flagged record
            flagged_rec = Recommendations(
                analysis_id=analysis_id,
                type='Remedy',
                model_version='AI-Generated-V1',
                title='Flagged as Incorrect',
                description='Admin flagged this scan as incorrect. AI detection may be inaccurate.',
                admin_status='Flagged'
            )
            db.session.add(flagged_rec)

        db.session.commit()

        # --- Send Email Notification to User ---
        try:
            if scan.user and scan.user.email:
                subject = "Derma AI — Important Notice About Your Recent Scan"
                body = f"""Hello {scan.user.name},

We wanted to inform you about your recent skin scan submitted on {scan.analysis_date.strftime('%d %b, %Y')}.

After careful review, our dermatology team has flagged the AI detection result for:
  Condition Detected: {scan.detected_issue}

as POTENTIALLY INACCURATE. This means the AI may not have correctly identified your skin condition.

What does this mean for you?
  • The scan result will NOT be shared as a formal report.
  • We recommend you retake the scan under better lighting conditions, or consult a dermatologist directly.
  • You can log in to your Derma AI dashboard to submit a new scan at any time.

We apologize for any inconvenience and are committed to providing you with the most accurate analysis possible.

Warm regards,
The Derma AI Team
— derma-ai.com —
"""
                send_email(scan.user.email, subject, body)
                print(f"Flag notification email sent to {scan.user.email}")
        except Exception as email_err:
            print(f"Warning: Failed to send flag email: {email_err}")

        return jsonify({"status": "success", "message": "Scan flagged as incorrect"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

import smtplib
from email.mime.text import MIMEText
import random
from datetime import datetime, timedelta

# ==========================================================
# --- 1.6 FORGOT PASSWORD (SMTP) ---
# ==========================================================
def send_email(to_email, subject, body):
    sender_email = os.getenv("MAIL_USERNAME")
    sender_password = os.getenv("MAIL_PASSWORD")
    
    if not sender_email or not sender_password:
        print("Error: Mail credentials not found in env")
        return False

    try:
        msg = MIMEText(body)
        msg['Subject'] = subject
        msg['From'] = sender_email
        msg['To'] = to_email

        print(f"Attempting to connect to SMTP for {to_email}...")
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            print("Connected to SMTP server.")
            server.login(sender_email, sender_password)
            print("Logged in successfully.")
            server.sendmail(sender_email, to_email, msg.as_string())
            print("Email sent successfully.")
        return True
    except Exception as e:
        print(f"Error sending email: {type(e).__name__}: {e}")
        return False

@app.route('/api/user/forgot-password', methods=['POST'])
def forgot_password():
    try:
        data = request.json
        email = data.get('email')
        user = User.query.filter_by(email=email).first()
        
        if not user:
            return jsonify({"status": "error", "message": "Email not found"}), 404

        # Generate 6-digit OTP
        otp = str(random.randint(100000, 999999))
        user.reset_otp = otp
        user.otp_expiry = datetime.utcnow() + timedelta(minutes=15) # Valid for 15 mins
        db.session.commit()

        # Send Email
        subject = "Derma Ai - Password Reset OTP"
        body = f"Your OTP for password reset is: {otp}\n\nThis code expires in 15 minutes."
        
        if send_email(email, subject, body):
            return jsonify({"status": "success", "message": "OTP sent to email"}), 200
        else:
            return jsonify({"status": "error", "message": "Failed to send email"}), 500

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/user/verify-otp', methods=['POST'])
def verify_otp():
    try:
        data = request.json
        email = data.get('email')
        otp = data.get('otp')
        
        user = User.query.filter_by(email=email).first()
        
        if not user:
            return jsonify({"status": "error", "message": "User not found"}), 404
            
        if user.reset_otp != otp:
             return jsonify({"status": "error", "message": "Invalid OTP"}), 400
             
        if user.otp_expiry < datetime.utcnow():
             return jsonify({"status": "error", "message": "OTP expired"}), 400

        return jsonify({"status": "success", "message": "OTP verified"}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/user/reset-password', methods=['POST'])
def reset_password():
    try:
        data = request.json
        email = data.get('email')
        otp = data.get('otp') # Verify again for security
        new_password = data.get('password')
        
        user = User.query.filter_by(email=email).first()
        
        if not user or user.reset_otp != otp or user.otp_expiry < datetime.utcnow():
            return jsonify({"status": "error", "message": "Invalid or expired request"}), 400
            
        # Update Password
        user.password = generate_password_hash(new_password)
        user.reset_otp = None 
        user.otp_expiry = None
        db.session.commit()
        
        print(f"PASSWORD UPDATED SUCCESSFULLY FOR: {email}") # LOG ADDED
        
        return jsonify({"status": "success", "message": "Password reset successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/admin/generate-routine', methods=['POST'])
def generate_routine():
    try:
        data = request.json
        if not data:
            return jsonify({"status": "error", "message": "No data received"}), 400
            
        issue = data.get('issue')
        allergies = data.get('allergies', [])

        if not issue:
            return jsonify({"status": "error", "message": "Skin issue description is missing"}), 400

        print(f"--- Calling AI for: {issue} ---")
        
        allergy_text = ""
        if allergies and isinstance(allergies, list) and len(allergies) > 0:
            allergy_list_str = ", ".join(allergies)
            allergy_text = f'\nThe user has the following allergies: {allergy_list_str}. Recommend recipes that strictly avoid these ingredients and only suggest recipes that are safe for the user.'

        # JSON Structure Prompt
        prompt = f"""
        As a professional dermatologist assistant, verify the detected issue "{issue}" and provide a skincare routine.{allergy_text}
        Return ONLY a valid JSON object with the following structure. Do not wrap it in markdown code blocks.
        {{
            "routine_summary": "A brief overview of the daily routine (under 50 words).",
            "products": [
                {{
                    "title": "Product Name/Type",
                    "description": "How to use this product for {issue}.",
                    "type": "Product"
                }}
            ],
            "remedies": [
                {{
                    "title": "Remedy Name",
                    "description": "Ingredients and instructions for {issue}.",
                    "type": "Remedy"
                }}
            ]
        }}
        """

        routine_data = None

        # 1. Try Gemini Key 1
        try:
            print("Attempting Gemini (Key 1)...")
            client1 = genai.Client(api_key=os.environ.get("GEMINI_API_KEY_1"))
            response = client1.models.generate_content(
                model="gemini-flash-latest",
                contents=prompt,
                config={'response_mime_type': 'application/json'}
            )
            if response and response.text:
                routine_data = json.loads(response.text)
                print("Gemini (Key 1) Success")
        except Exception as e1:
            print(f"Gemini (Key 1) Failed: {e1}")
            
            # 2. Retry with Gemini Key 2
            try:
                print("Attempting Gemini (Key 2)...")
                client2 = genai.Client(api_key=os.environ.get("GEMINI_API_KEY_2"))
                response2 = client2.models.generate_content(
                    model="gemini-flash-latest",
                    contents=prompt,
                    config={'response_mime_type': 'application/json'}
                )
                if response2 and response2.text:
                    routine_data = json.loads(response2.text)
                    print("Gemini (Key 2) Success")
            except Exception as e2:
                print(f"Gemini (Key 2) Failed: {e2}")
                
                # 3. Retry with Gemini Key 3
                try:
                    print("Attempting Gemini (Key 3)...")
                    client3 = genai.Client(api_key=os.environ.get("GEMINI_API_KEY_3"))
                    response3 = client3.models.generate_content(
                        model="gemini-flash-latest",
                        contents=prompt,
                        config={'response_mime_type': 'application/json'}
                    )
                    if response3 and response3.text:
                        routine_data = json.loads(response3.text)
                        print("Gemini (Key 3) Success")
                except Exception as e3:
                    print(f"Gemini (Key 3) Failed: {e3}")

                    # 4. Retry with Gemini Key 4
                    try:
                        print("Attempting Gemini (Key 4)...")
                        client4 = genai.Client(api_key=os.environ.get("GEMINI_API_KEY_4"))
                        response4 = client4.models.generate_content(
                            model="gemini-flash-latest",
                            contents=prompt,
                            config={'response_mime_type': 'application/json'}
                        )
                        if response4 and response4.text:
                            routine_data = json.loads(response4.text)
                            print("Gemini (Key 4) Success")
                    except Exception as e4:
                        print(f"Gemini (Key 4) Failed: {e4}")
                        routine_data = None

        # 5. Fallback to Groq if Gemini failed
        if not routine_data:
            print("Attempting Groq Fallback...")
            try:
                chat_completion = groq_client.chat.completions.create(
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a dermatologist assistant. Output ONLY valid JSON."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    model="meta-llama/llama-4-scout-17b-16e-instruct",
                    temperature=1,
                    max_completion_tokens=8192,
                    top_p=1,
                    reasoning_effort="medium",
                    response_format={"type": "json_object"}
                )
                routine_data = json.loads(chat_completion.choices[0].message.content)
                print("Groq Success")
            except Exception as e:
                print(f"Groq Failed: {e}")
                return jsonify({"status": "error", "message": "Both AI models failed to generate valid response."}), 500

        return jsonify({"status": "success", "routine": routine_data}), 200

    except Exception as e:
        print(f"!!! SERVER CRASH: {str(e)}") 
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/admin/verify-scan/<int:analysis_id>', methods=['PUT', 'POST']) # Support both for flexibility
def verify_scan(analysis_id):
    try:
        data = request.json
        recommendation = data.get('recommendation')
        rec_type = data.get('type', 'Remedy') # Default to Remedy

        scan = SkinAnalysis.query.get(analysis_id)
        if not scan: return jsonify({"status": "error", "message": "Scan not found"}), 404
        
        # Mark scan as reviewed
        scan.is_reviewed = True
        
        # Approve comparison history if it exists
        comp_history = ComparisonHistory.query.filter_by(analysis_id=analysis_id).first()
        if comp_history:
            comp_history.is_approved = True
            
        # Save Recommendation
        new_rec = Recommendations(
            analysis_id=analysis_id,
            type=rec_type,
            model_version='AI-Generated-V1',
            title='Expert Advice',
            description=recommendation,
            admin_status='Verified'
        )
        db.session.add(new_rec)
        
        db.session.commit()
        return jsonify({"status": "success", "message": "Verified and saved successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/admin/verify-scan-batch/<int:analysis_id>', methods=['POST'])
def verify_scan_batch(analysis_id):
    try:
        data = request.json # Expects { "recommendations": [...] }
        scan = SkinAnalysis.query.get(analysis_id)
        if not scan: return jsonify({"status": "error", "message": "Scan not found"}), 404
        
        # 1. Clear existing recommendations to prevent duplicates
        Recommendations.query.filter_by(analysis_id=analysis_id).delete()
        
        scan.is_reviewed = True
        # Approve comparison history if it exists
        comp_history = ComparisonHistory.query.filter_by(analysis_id=analysis_id).first()
        if comp_history:
            comp_history.is_approved = True
            
        # NOTE: We do NOT set is_sent=True here. That requires a separate action.
        
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
        return jsonify({"status": "success", "message": "Saved successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/admin/scan-recommendations/<int:analysis_id>', methods=['GET'])
def get_scan_recommendations(analysis_id):
    try:
        scan = SkinAnalysis.query.get(analysis_id)
        if not scan: return jsonify({"status": "error", "message": "Scan not found"}), 404
        
        recs = Recommendations.query.filter_by(analysis_id=analysis_id).all()
        products = []
        remedies = []
        routine_summary = ""
        
        for r in recs:
            if r.title == 'Daily Routine Summary':
                routine_summary = r.description
            elif r.type == 'Product':
                products.append({
                    "title": r.title,
                    "description": r.description,
                    "type": r.type,
                    "link": r.link
                })
            else:
                remedies.append({
                    "title": r.title,
                    "description": r.description,
                    "type": r.type,
                    "link": r.link
                })
                
        return jsonify({
            "status": "success",
            "routine_summary": routine_summary,
            "products": products,
            "remedies": remedies
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/admin/send-response/<int:analysis_id>', methods=['POST'])
def send_response(analysis_id):
    try:
        scan = SkinAnalysis.query.get(analysis_id)
        if not scan: return jsonify({"status": "error", "message": "Scan not found"}), 404
        
        if not scan.is_reviewed:
             return jsonify({"status": "error", "message": "Scan must be verified first"}), 400

        # Block sending if scan has been flagged as incorrect
        is_flagged = Recommendations.query.filter_by(
            analysis_id=analysis_id, admin_status='Flagged'
        ).first() is not None
        if is_flagged:
            return jsonify({"status": "error", "message": "Cannot send a flagged scan to the user"}), 400

        scan.is_sent = True
        db.session.commit()
        
        # --- Send Email Notification to User ---
        try:
            if scan.user and scan.user.email:
                subject = "Derma AI - Your Scan Results are Ready"
                body = f"Hello {scan.user.name},\n\nAn admin has reviewed your recent skin scan and provided expert advice.\n\nPlease log in to your Derma AI dashboard to view the results and recommendations.\n\nBest regards,\nDerma AI Team"
                send_email(scan.user.email, subject, body)
        except Exception as email_err:
            print(f"Warning: Failed to send email to user: {email_err}")
            # Continuing, as the core save action was successful.
        
        return jsonify({"status": "success", "message": "Response sent to user"}), 200
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

# ==========================================================
# --- 6. USER SKIN ANALYSIS (GEMINI) ---
# ==========================================================
@app.route('/api/analyze-skin', methods=['POST'])
def analyze_skin():
    try:
        if 'image' not in request.files:
            return jsonify({"status": "error", "message": "No image part"}), 400
            
        file = request.files['image']
        
        if file.filename == '':
            return jsonify({"status": "error", "message": "No selected file"}), 400

        if file:
            # save locally to upload/process
            filename = f"scan_{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}"
            upload_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
            if not os.path.exists(upload_folder):
                os.makedirs(upload_folder)
                
            filepath = os.path.join(upload_folder, filename)
            file.save(filepath)

            print(f"--- Analyzing Image: {filename} ---")

            # Prepare Prompt for Gemini
            prompt = """
            You are a highly experienced dermatologist with a master's degree in dermatology and clinical skin diagnosis.

            Your task is to carefully analyze the provided face image using professional dermatological standards.

            Rules:
            1. Only mention a skin issue if you are clearly confident it exists.
            2. If the skin appears normal and healthy, clearly say: "No visible dermatological concerns detected."
            3. Do NOT assume or guess problems.
            4. Do NOT exaggerate minor natural skin texture.
            5. Ignore lighting, camera quality, shadows, or filters.
            6. Be precise and professional.

            If any issue is detected, describe:
            - Type of condition
            - Severity (mild/moderate/severe)
            - Possible causes
            - Basic skincare advice

            If nothing is wrong, clearly confirm the skin looks healthy.

            Maintain a calm, medical, and professional tone.
            
            Return ONLY a valid JSON object with the following structure:
            {
                "detected_issue": "Name of the condition (e.g., Acne, Eczema, etc.) or 'Healthy Skin'",
                "summary": "A friendly, easy-to-understand explanation of what is seen in the image (max 50 words).",
                "confidence": "High/Medium/Low",
                "severity": "Mild/Moderate/Severe",
                "routine_suggestions": ["Step 1...", "Step 2..."],
                "disclaimer": "This is an AI analysis and not a medical diagnosis. Please consult a doctor."
            }
            """

            # Call Gemini API
            analysis_result = None
            gemini_error = None
            
            # 1. Try Gemini Key 1
            try:
                print("Attempting Gemini (Key 1)...")
                with open(filepath, "rb") as f:
                    image_data = f.read()
                
                from google.genai import types
                
                # Create image part using Blob
                image_part = types.Part(
                    inline_data=types.Blob(
                        mime_type='image/jpeg',
                        data=image_data
                    )
                )
                
                client1 = genai.Client(api_key=os.environ.get("GEMINI_API_KEY_1"))
                response = client1.models.generate_content(
                    model="gemini-flash-latest",
                    contents=[prompt, image_part],
                    config={'response_mime_type': 'application/json'}
                )
                
                if response and response.text:
                    analysis_result = json.loads(response.text)
                    print("Gemini (Key 1) Analysis Success")
            
            except Exception as e1:
                gemini_error = str(e1)
                print(f"Gemini (Key 1) Failed: {gemini_error}")
                
                # 2. Try Gemini Key 2
                try:
                    print("Attempting Gemini (Key 2)...")
                    client2 = genai.Client(api_key=os.environ.get("GEMINI_API_KEY_2"))
                    response2 = client2.models.generate_content(
                        model="gemini-flash-latest",
                        contents=[prompt, image_part],
                        config={'response_mime_type': 'application/json'}
                    )
                    
                    if response2 and response2.text:
                        analysis_result = json.loads(response2.text)
                        print("Gemini (Key 2) Analysis Success")
                        
                except Exception as e2:
                    gemini_error += f" | Key 2 Failed: {str(e2)}"
                    print(f"Gemini (Key 2) Failed: {e2}")
                    
                    # 3. Try Gemini Key 3
                    try:
                        print("Attempting Gemini (Key 3)...")
                        client3 = genai.Client(api_key=os.environ.get("GEMINI_API_KEY_3"))
                        response3 = client3.models.generate_content(
                            model="gemini-flash-latest",
                            contents=[prompt, image_part],
                            config={'response_mime_type': 'application/json'}
                        )
                        
                        if response3 and response3.text:
                            analysis_result = json.loads(response3.text)
                            print("Gemini (Key 3) Analysis Success")
                            
                    except Exception as e3:
                        gemini_error += f" | Key 3 Failed: {str(e3)}"
                        print(f"Gemini (Key 3) Failed: {e3}")
                        
                        # 4. Try Gemini Key 4
                        try:
                            print("Attempting Gemini (Key 4)...")
                            client4 = genai.Client(api_key=os.environ.get("GEMINI_API_KEY_4"))
                            response4 = client4.models.generate_content(
                                model="gemini-flash-latest",
                                contents=[prompt, image_part],
                                config={'response_mime_type': 'application/json'}
                            )
                            
                            if response4 and response4.text:
                                analysis_result = json.loads(response4.text)
                                print("Gemini (Key 4) Analysis Success")
                                
                        except Exception as e4:
                            gemini_error += f" | Key 4 Failed: {str(e4)}"
                            print(f"Gemini (Key 4) Failed: {e4}")
                            analysis_result = None

            # 5. Fallback to Groq
            if not analysis_result:
                print("Attempting Groq Fallback...")
                try:
                    # Encode image to base64 for Groq
                    with open(filepath, "rb") as f:
                        base64_image = base64.b64encode(f.read()).decode('utf-8')
                    
                    chat_completion = groq_client.chat.completions.create(
                        messages=[
                            {
                                "role": "user",
                                "content": [
                                    {"type": "text", "text": prompt},
                                    {
                                        "type": "image_url",
                                        "image_url": {
                                            "url": f"data:image/jpeg;base64,{base64_image}"
                                        }
                                    }
                                ]
                            }
                        ],
                        
                        model="meta-llama/llama-4-scout-17b-16e-instruct",
                        response_format={"type": "json_object"}
                    )
                    
                    groq_response = chat_completion.choices[0].message.content
                    if groq_response:
                        analysis_result = json.loads(groq_response)
                        print("Groq Analysis Success")
                
                except Exception as groq_error:
                    print(f"Groq Failed: {groq_error}")
                    return jsonify({"status": "error", "message": f"AI Analysis Failed. Gemini Error: {str(gemini_error)}. Groq Error: {str(groq_error)}"}), 500

            if analysis_result:
                # Save to DB (even for anonymous users)
                user_id = request.form.get('user_id')
                try:
                    new_scan = SkinAnalysis(
                        user_id=int(user_id) if user_id else None,  # Allow None for anonymous users
                        scan_type="Upload",
                        detected_issue=analysis_result.get('detected_issue', 'Unknown'),
                        summary=analysis_result.get('summary', ''),
                        confidence_score=0.95 if analysis_result.get('confidence') == 'High' else 0.8,
                        is_reviewed=False,
                        image_path=filename,
                        analysis_date=datetime.utcnow()
                    )
                    db.session.add(new_scan)
                    db.session.commit()
                    analysis_result['analysis_id'] = new_scan.analysis_id
                    print(f"✓ Scan saved to database with ID: {new_scan.analysis_id} (user_id: {user_id or 'Anonymous'})")
                except Exception as db_error:
                    print(f"✗ Database save failed: {str(db_error)}")
                    db.session.rollback()
                    return jsonify({"status": "error", "message": f"Failed to save scan to database: {str(db_error)}"}), 500

                return jsonify({"status": "success", "result": analysis_result, "image_url": f"/uploads/{filename}"}), 200
            else:
                 return jsonify({"status": "error", "message": "AI returned empty response"}), 500



    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# ==========================================================
# --- 7. USER HISTORY & PREFERENCES ---
# ==========================================================
@app.route('/api/user/profile/<int:user_id>', methods=['GET'])
def get_user_profile(user_id):
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({"status": "error", "message": "User not found"}), 404
            
        try:
            allergies_list = json.loads(user.allergies) if user.allergies else []
        except:
            allergies_list = [user.allergies] if user.allergies else []
            
        user_data = {
            "user_id": user.user_id,
            "name": user.name,
            "email": user.email,
            "skin_type": user.skin_type,
            "gender": user.gender,
            "birth_date": user.birth_date.strftime("%Y-%m-%d") if user.birth_date else None,
            "allergies": allergies_list,
            "created_at": user.created_at.isoformat() if user.created_at else None
        }
        return jsonify({"status": "success", "user": user_data}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
@app.route('/api/user/scans/<int:user_id>', methods=['GET'])
def get_user_scans(user_id):
    try:
        scans = SkinAnalysis.query.filter_by(user_id=user_id, is_deleted=False, user_deleted=False).order_by(SkinAnalysis.analysis_date.desc()).all()
        output = [{
            "analysis_id": s.analysis_id,
            "detected_issue": s.detected_issue,
            "summary": s.summary,
            "confidence": s.confidence_score,
            "image_path": s.image_path,
            "analysis_date": s.analysis_date.isoformat(),
            "is_reviewed": s.is_reviewed,
            "user_preference": s.user_preference
        } for s in scans]
        return jsonify({"status": "success", "scans": output}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/user/scan/<int:analysis_id>', methods=['DELETE'])
def delete_user_scan(analysis_id):
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({"status": "error", "message": "User ID required"}), 400
            
        scan = SkinAnalysis.query.get(analysis_id)
        if not scan or scan.user_deleted:
            return jsonify({"status": "error", "message": "Scan not found"}), 404
            
        if str(scan.user_id) != str(user_id):
            return jsonify({"status": "error", "message": "Unauthorized"}), 403
            
        if scan.is_reviewed:
            scan.user_deleted = True
        else:
            # Manually delete dependent records to avoid Foreign Key constraint errors
            ComparisonHistory.query.filter_by(analysis_id=scan.analysis_id).delete()
            ComparisonHistory.query.filter_by(previous_analysis_id=scan.analysis_id).update({"previous_analysis_id": None})
            Recommendations.query.filter_by(analysis_id=scan.analysis_id).delete()
            db.session.delete(scan)
        db.session.commit()
        return jsonify({"status": "success", "message": "Scan deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/user/comparison-history/<int:user_id>', methods=['GET'])
def get_comparison_history(user_id):
    try:
        history = ComparisonHistory.query.filter_by(user_id=user_id, user_deleted=False).order_by(ComparisonHistory.created_at.desc()).all()
        output = []
        for h in history:
            current_scan = SkinAnalysis.query.get(h.analysis_id)
            prev_scan = SkinAnalysis.query.get(h.previous_analysis_id) if h.previous_analysis_id else None
            
            output.append({
                "history_id": h.history_id,
                "comparison_summary": h.comparison_summary,
                "status": h.status,
                "detected_issue": current_scan.detected_issue if current_scan else "Unknown",
                "improvement_score": h.improvement_score,
                "is_approved": h.is_approved,
                "created_at": h.created_at.strftime("%d %b, %Y"),
                "current_image_url": f"/uploads/{current_scan.image_path}" if current_scan else None,
                "previous_image_url": f"/uploads/{prev_scan.image_path}" if prev_scan else None
            })
        return jsonify({"status": "success", "history": output}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/user/comparison-history/<int:history_id>', methods=['DELETE'])
def delete_comparison_history(history_id):
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({"status": "error", "message": "User ID required"}), 400
            
        history = ComparisonHistory.query.get(history_id)
        if not history or history.user_deleted:
            return jsonify({"status": "error", "message": "History record not found"}), 404
            
        if str(history.user_id) != str(user_id):
            return jsonify({"status": "error", "message": "Unauthorized"}), 403
            
        if history.is_approved:
            history.user_deleted = True
        else:
            db.session.delete(history)
            
        db.session.commit()
        return jsonify({"status": "success", "message": "Comparison history deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/user/scan-preference', methods=['POST'])
def save_scan_preference():
    try:
        data = request.json
        analysis_id = data.get('analysis_id')
        preference = data.get('preference') # 'Product' or 'Remedy'
        
        scan = SkinAnalysis.query.get(analysis_id)
        if not scan:
             return jsonify({"status": "error", "message": "Scan not found"}), 404
             
        scan.user_preference = preference
        db.session.commit()
        
        # Fetch filtered recommendations
        recs = Recommendations.query.filter_by(analysis_id=analysis_id, type=preference).all()
        
        output = [{
            "title": r.title,
            "description": r.description,
            "type": r.type
        } for r in recs]
        
        return jsonify({"status": "success", "recommendations": output}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/user/scan-details/<int:analysis_id>', methods=['GET'])
def get_scan_details(analysis_id):
    try:
        scan = SkinAnalysis.query.get(analysis_id)
        if not scan: return jsonify({"status": "error", "message": "Not found"}), 404
        
        # Get recommendations if reviewed
        recs = []
        if scan.is_sent:
             rec_query = Recommendations.query.filter_by(analysis_id=analysis_id).all()
             
             for r in rec_query:
                 can_review = False
                 reviews_data = []
                 
                 if r.type == 'Product':
                     # Fetch all reviews for this product
                     all_reviews = ProductReview.query.filter_by(product_name=r.title).order_by(ProductReview.created_at.desc()).all()
                     reviews_data = [{
                         "user_name": rev.user.name if rev.user else "Anonymous",
                         "rating": rev.rating,
                         "review_text": rev.review_text,
                         "date": rev.created_at.strftime("%d %b, %Y") if rev.created_at else ""
                     } for rev in all_reviews]
                     
                     if scan.user_id:
                         # Has the user already reviewed this product?
                         has_reviewed = ProductReview.query.filter_by(user_id=scan.user_id, product_name=r.title).first() is not None
                         
                         if not has_reviewed:
                             # Is this the oldest scan for this user where this product was recommended?
                             oldest_scan_id_query = db.session.query(SkinAnalysis.analysis_id)\
                                 .join(Recommendations, SkinAnalysis.analysis_id == Recommendations.analysis_id)\
                                 .filter(SkinAnalysis.user_id == scan.user_id)\
                                 .filter(Recommendations.title == r.title)\
                                 .order_by(SkinAnalysis.analysis_date.asc())\
                                 .first()
                             
                             if oldest_scan_id_query and oldest_scan_id_query[0] == scan.analysis_id:
                                 can_review = True

                 recs.append({
                    "title": r.title,
                    "description": r.description,
                    "type": r.type,
                    "reviews": reviews_data,
                    "can_review": can_review
                 })

        # Derive is_flagged
        is_flagged = Recommendations.query.filter_by(
            analysis_id=analysis_id, admin_status='Flagged'
        ).first() is not None

        return jsonify({
            "status": "success",
            "scan": {
                "analysis_id": scan.analysis_id,
                "detected_issue": scan.detected_issue,
                "summary": scan.summary,
                "confidence": scan.confidence_score,
                "image_path": scan.image_path,
                "date": scan.analysis_date.strftime("%d %b, %Y"),
                "is_reviewed": scan.is_reviewed,
                "user_preference": scan.user_preference,
                "is_sent": scan.is_sent,
                "is_flagged": is_flagged
            },
            "recommendations": recs
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/user/product-review', methods=['POST'])
def save_product_review():
    try:
        data = request.json
        user_id = data.get('user_id')
        product_name = data.get('product_name')
        rating = data.get('rating')
        review_text = data.get('review_text')

        if not all([user_id, product_name, rating]):
            return jsonify({"status": "error", "message": "Missing required fields"}), 400

        # Optional: check if already reviewed
        existing = ProductReview.query.filter_by(user_id=user_id, product_name=product_name).first()
        if existing:
            return jsonify({"status": "error", "message": "You have already reviewed this product"}), 400

        new_review = ProductReview(
            user_id=user_id,
            product_name=product_name,
            rating=int(rating),
            review_text=review_text
        )
        db.session.add(new_review)
        db.session.commit()
        return jsonify({"status": "success", "message": "Review added successfully"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/user/progress-report', methods=['POST'])
def progress_report():
    try:
        if 'image' not in request.files:
            return jsonify({"status": "error", "message": "No image part"}), 400
            
        file = request.files['image']
        user_id = request.form.get('user_id')

        if not user_id:
             return jsonify({"status": "error", "message": "User ID is required"}), 400
        
        if file.filename == '':
            return jsonify({"status": "error", "message": "No selected file"}), 400

        if file:
            # 1. Save new image locally
            filename = f"progress_{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}"
            upload_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
            if not os.path.exists(upload_folder):
                os.makedirs(upload_folder)
                
            filepath = os.path.join(upload_folder, filename)
            file.save(filepath)

            print(f"--- Processing Progress Report for User {user_id}: {filename} ---")

            # 2. Find Previous Scan (Can be 'Upload' or 'Progress Report')
            previous_scan = SkinAnalysis.query.filter_by(user_id=user_id).order_by(SkinAnalysis.analysis_date.desc()).first()
            
            prompt = ""
            previous_image_path = None
            
            if previous_scan:
                print(f"Found previous progress scan: {previous_scan.image_path}")
                previous_image_path = os.path.join(upload_folder, previous_scan.image_path)
                
                prompt = """
                You are a dermatologist comparing two images of a patient's skin condition.
                Image 1: Previous Scan
                Image 2: Current Scan (New)
                
                Compare the skin condition (e.g. acne, redness, spots).
                - Has it improved, worsened, or stayed the same?
                - Be specific about changes in specific areas if visible.
                - Provide a short, encouraging summary (max 60 words).
                - Give an improvement score from -100 to 100 representing the percentage change. 
                  (e.g., 50 for 50% improved, 0 for unchanged, -30 for 30% worsened)
                
                Return ONLY a valid JSON object:
                {
                    "comparison_summary": "Your insightful comparison text here...",
                    "status": "Improved" | "Worsened" | "Unchanged",
                    "detected_issue": "Name of the primary condition seen (e.g. Acne, Clear Skin, etc.)",
                    "improvement_score": <integer from -100 to 100>
                }
                """
            else:
                print("No previous progress scan found. Establishing baseline.")
                prompt = """
                You are a dermatologist analyzing a baseline image for a skin progress report.
                Analyze the skin condition.
                
                Return ONLY a valid JSON object:
                {
                    "comparison_summary": "Baseline image recorded. We will compare future scans against this to track your progress.",
                    "status": "Baseline",
                    "detected_issue": "Name of the condition seen (e.g. Acne, Clear Skin, etc.)",
                    "improvement_score": 0
                }
                """

            # 3. Call AI (Gemini)
            analysis_result = None
            gemini_error = None
            
            # 1. Try Gemini Key 1
            try:
                print("Attempting Gemini (Key 1) Comparison...")
                
                # Check if previous image exists on disk
                inputs = [prompt]
                
                # Load Current Image
                with open(filepath, "rb") as f:
                    current_image_data = f.read()
                
                from google.genai import types
                
                if previous_scan and os.path.exists(previous_image_path):
                     with open(previous_image_path, "rb") as f:
                        prev_image_data = f.read()
                        
                     inputs.append(types.Part(
                        inline_data=types.Blob(
                            mime_type='image/jpeg',
                            data=prev_image_data
                        )
                    ))
                     inputs.append(types.Part(
                        inline_data=types.Blob(
                            mime_type='image/jpeg',
                            data=current_image_data
                        )
                    ))
                else:
                    # Baseline or prev image missing
                    inputs.append(types.Part(
                        inline_data=types.Blob(
                            mime_type='image/jpeg',
                            data=current_image_data
                        )
                    ))

                client1 = genai.Client(api_key=os.environ.get("GEMINI_API_KEY_1"))
                response = client1.models.generate_content(
                    model="gemini-flash-latest",
                    contents=inputs,
                    config={'response_mime_type': 'application/json'}
                )
                
                if response and response.text:
                    analysis_result = json.loads(response.text)
                    print("Gemini (Key 1) Progress Analysis Success")

            except Exception as e1:
                gemini_error = str(e1)
                print(f"Gemini (Key 1) Progress Failed: {gemini_error}")
                
                # 2. Try Gemini Key 2
                try:
                    print("Attempting Gemini (Key 2) Comparison...")
                    client2 = genai.Client(api_key=os.environ.get("GEMINI_API_KEY_2"))
                    response2 = client2.models.generate_content(
                        model="gemini-flash-latest",
                        contents=inputs,
                        config={'response_mime_type': 'application/json'}
                    )
                    
                    if response2 and response2.text:
                        analysis_result = json.loads(response2.text)
                        print("Gemini (Key 2) Progress Analysis Success")
                        
                except Exception as e2:
                    gemini_error += f" | Key 2 Failed: {str(e2)}"
                    print(f"Gemini (Key 2) Progress Failed: {e2}")
                
                    # 3. Try Gemini Key 3
                    try:
                        print("Attempting Gemini (Key 3) Comparison...")
                        client3 = genai.Client(api_key=os.environ.get("GEMINI_API_KEY_3"))
                        response3 = client3.models.generate_content(
                            model="gemini-flash-latest",
                            contents=inputs,
                            config={'response_mime_type': 'application/json'}
                        )
                        
                        if response3 and response3.text:
                            analysis_result = json.loads(response3.text)
                            print("Gemini (Key 3) Progress Analysis Success")
                            
                    except Exception as e3:
                        gemini_error += f" | Key 3 Failed: {str(e3)}"
                        print(f"Gemini (Key 3) Progress Failed: {e3}")
                
                    # 4. Try Gemini Key 4
                    try:
                        print("Attempting Gemini (Key 4) Comparison...")
                        client4 = genai.Client(api_key=os.environ.get("GEMINI_API_KEY_4"))
                        response4 = client4.models.generate_content(
                            model="gemini-flash-latest",
                            contents=inputs,
                            config={'response_mime_type': 'application/json'}
                        )
                        
                        if response4 and response4.text:
                            analysis_result = json.loads(response4.text)
                            print("Gemini (Key 4) Progress Analysis Success")
                            
                    except Exception as e4:
                        gemini_error += f" | Key 4 Failed: {str(e4)}"
                        print(f"Gemini (Key 4) Progress Failed: {e4}")
                
                # --- 5. Groq Fallback ---
                if not analysis_result:
                    try: 
                        print("Attempting Groq Vision Fallback...")
                        
                        # Helper for base64
                        def encode_image(img_path):
                            with open(img_path, "rb") as image_file:
                                return base64.b64encode(image_file.read()).decode('utf-8')
                                
                        current_b64 = encode_image(filepath)
                        
                        messages_content = [
                            {"type": "text", "text": prompt}
                        ]
                        
                        if previous_scan and os.path.exists(previous_image_path):
                             prev_b64 = encode_image(previous_image_path)
                             messages_content.append({
                                 "type": "image_url",
                                 "image_url": {
                                     "url": f"data:image/jpeg;base64,{prev_b64}"
                                 }
                             })
                             
                        messages_content.append({
                             "type": "image_url",
                             "image_url": {
                                 "url": f"data:image/jpeg;base64,{current_b64}"
                             }
                        })
                        
                        chat_completion = groq_client.chat.completions.create(
                            messages=[
                                {
                                    "role": "user",
                                    "content": messages_content
                                }
                            ],
                            model="llama-3.2-11b-vision-preview",
                            temperature=0.5,
                            max_completion_tokens=1024,
                            top_p=1,
                            stop=None,
                            stream=False,
                            response_format={"type": "json_object"}
                        )
                        
                        if chat_completion.choices and chat_completion.choices[0].message.content:
                            analysis_result = json.loads(chat_completion.choices[0].message.content)
                            print("Groq Vision Success")
                            
                    except Exception as e2:
                         print(f"Groq Vision Failed: {e2}")
                         gemini_error += f" | Groq Failed: {str(e2)}"

            if analysis_result:
                # Save New Scan
                summary_text = analysis_result.get('comparison_summary', '')
                improvement_score = analysis_result.get('improvement_score')
                if improvement_score is not None:
                    summary_text += f"\n\nImprovement Score: {improvement_score}%"

                new_scan = SkinAnalysis(
                    user_id=user_id,
                    scan_type="Progress Report",
                    detected_issue=analysis_result.get('detected_issue', 'Unknown'),
                    summary=summary_text,
                    confidence_score=0.9, # Default high for progress
                    is_reviewed=False,
                    image_path=filename,
                    analysis_date=datetime.utcnow()
                )
                db.session.add(new_scan)
                db.session.commit()
                
                # Immediately persist Comparison History
                new_comp = ComparisonHistory(
                    user_id=user_id,
                    analysis_id=new_scan.analysis_id,
                    previous_analysis_id=previous_scan.analysis_id if previous_scan else None,
                    comparison_summary=analysis_result.get('comparison_summary', ''),
                    status=analysis_result.get('status', 'Unknown'),
                    improvement_score=improvement_score,
                    is_approved=False
                )
                db.session.add(new_comp)
                db.session.commit()
                
                return jsonify({
                    "status": "success", 
                    "result": analysis_result,
                    "previous_image_url": f"/uploads/{previous_scan.image_path}" if previous_scan else None,
                    "current_image_url": f"/uploads/{filename}"
                }), 200
            else:
                 return jsonify({"status": "error", "message": f"AI Parsing Failed: {gemini_error}"}), 500

    except Exception as e:
        print(f"Server Error in Progress Report: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)