from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

# 1. Admin Table (Already exists)
class Admin(db.Model):
    __tablename__ = 'admin' 
    admin_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# 2. Users Table (For "Total Users" card and "Skin Type" chart)
class User(db.Model):
    __tablename__ = 'users'
    user_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    birth_date = db.Column(db.Date)
    gender = db.Column(db.String(20))
    skin_type = db.Column(db.String(50)) # Oily, Dry, etc.
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# 3. Skin Analysis Table (For "Total Scans" card and "Issues" chart)
class SkinAnalysis(db.Model):
    __tablename__ = 'skin_analysis'
    analysis_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    scan_type = db.Column(db.String(50))
    detected_issue = db.Column(db.String(100))
    confidence_score = db.Column(db.Float)
    is_reviewed = db.Column(db.Boolean, default=False)
    image_path = db.Column(db.String(255), nullable=False)
    
    # Change 'created_at' to match your actual MySQL column name
    analysis_date = db.Column(db.DateTime, default=datetime.utcnow)

class Recommendations(db.Model):
    __tablename__ = 'recommendations'
    rec_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    analysis_id = db.Column(db.Integer, db.ForeignKey('skin_analysis.analysis_id'), nullable=False)
    type = db.Column(db.Enum('Remedy', 'Product'), nullable=False)
    model_version = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    link = db.Column(db.String(255))
    admin_status = db.Column(db.Enum('Pending', 'Verified', 'Flagged'), default='Pending')
    created_at = db.Column(db.DateTime, server_default=db.func.now())