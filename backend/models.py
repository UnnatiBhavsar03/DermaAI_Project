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
    allergies = db.Column(db.String(255), nullable=True)
    reset_otp = db.Column(db.String(6), nullable=True) # 6-digit OTP
    otp_expiry = db.Column(db.DateTime, nullable=True)
    is_deleted = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# 3. Skin Analysis Table (For "Total Scans" card and "Issues" chart)
class SkinAnalysis(db.Model):
    __tablename__ = 'skin_analysis'
    analysis_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=True)
    scan_type = db.Column(db.String(50))
    detected_issue = db.Column(db.String(100))
    summary = db.Column(db.Text) # AI Summary
    confidence_score = db.Column(db.Float)
    is_reviewed = db.Column(db.Boolean, default=False)
    image_path = db.Column(db.String(255), nullable=False)
    user_preference = db.Column(db.String(20)) # 'Remedy' or 'Product'
    is_sent = db.Column(db.Boolean, default=False)
    is_deleted = db.Column(db.Boolean, default=False)
    user_deleted = db.Column(db.Boolean, default=False)

    
    # Change 'created_at' to match your actual MySQL column name
    analysis_date = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    user = db.relationship('User', backref=db.backref('scans', lazy=True))

class ComparisonHistory(db.Model):
    __tablename__ = 'comparison_history'
    history_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    analysis_id = db.Column(db.Integer, db.ForeignKey('skin_analysis.analysis_id'), nullable=False)
    previous_analysis_id = db.Column(db.Integer, db.ForeignKey('skin_analysis.analysis_id'), nullable=True)
    comparison_summary = db.Column(db.Text)
    status = db.Column(db.String(50))
    improvement_score = db.Column(db.Integer, nullable=True)
    is_approved = db.Column(db.Boolean, default=False)
    user_deleted = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

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

class ProductReview(db.Model):
    __tablename__ = 'product_reviews'
    review_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    product_name = db.Column(db.String(255), nullable=False)
    rating = db.Column(db.Integer, nullable=False) # 1 to 5
    review_text = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    user = db.relationship('User', backref=db.backref('product_reviews', lazy=True))

import uuid

class Session(db.Model):
    __tablename__ = 'sessions'
    
    session_id = db.Column(db.String(128), primary_key=True) 
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    login_time = db.Column(db.DateTime, default=datetime.utcnow)
    last_activity = db.Column(db.DateTime, default=datetime.utcnow)
    ip_address = db.Column(db.String(45)) 
    device_info = db.Column(db.String(255))
    session_status = db.Column(db.String(20), default='active') 
    
    # Relationship
    user = db.relationship('User', backref=db.backref('sessions', lazy='dynamic'))

    def __init__(self, **kwargs):
        super(Session, self).__init__(**kwargs)
        if not self.session_id:
            self.session_id = str(uuid.uuid4().hex)
