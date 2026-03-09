# Derma AI 🌿

**Derma AI** is an intelligent, user-friendly platform that combines advanced AI computer vision with human dermatological expertise to provide personalized skin health analysis, recommendations, and progress tracking.

---

## 📖 Project Overview

Derma AI empowers users to take control of their skin health. By simply uploading a photo, our AI engine detects potential skin conditions and generates a customized report. To ensure clinical accuracy and safety, all AI-generated scans are sent to an Admin/Dermatologist dashboard for **expert verification**. Once verified, users receive a comprehensive breakdown of their skin condition, along with tailored skincare product recommendations and natural home remedies.

---

## ✨ Features

- **🤖 AI Skin Analysis:** Fast, accurate detection of skin conditions using advanced Generative AI models (Google Gemini / Groq). 
- **👨‍⚕️ Admin Verification:** Human-in-the-loop system. Dermatologists review, edit, approve, or flag AI results before they reach the user to ensure medical accuracy.
- **🛍️ Recommendation System:** Provides users with a curated list of skincare products and natural, easy-to-do home remedies specifically suited to their verified skin condition.
- **📈 Progress Reports:** Users can take follow-up scans and track their skin's healing journey over time with visual progress reports.
- **📧 Email Notifications:** Automated, branded email alerts keep users updated when their scan is received, verified, or flagged as inaccurate.

---

## 💻 Tech Stack

**Frontend**
- **Framework:** React.js
- **Styling:** Tailwind CSS (Vanilla CSS for base styling)
- **Icons:** Lucide React
- **Routing:** React Router DOM

**Backend**
- **Framework:** Python / Flask
- **Database:** MySQL
- **ORM:** Flask-SQLAlchemy & Flask-Migrate
- **AI Integration:** Google Generative AI (Gemini APIs) & Groq API
- **Emails:** Python `smtplib` / `email.mime`

---

## 🚀 Installation & Setup

Follow these steps to run the Derma AI project locally.

### Prerequisites
- Node.js & npm installed
- Python 3.9+ installed
- MySQL Server installed and running

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd DermaAI_Project
```

### 2. Backend Setup
```bash
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
# Create a .env file locally with your Database URI and API keys
# e.g., DATABASE_URL=mysql+pymysql://user:password@localhost/derma_ai_db
# GEMINI_API_KEY=your_key

# Run database migrations
flask db upgrade

# Start the Flask server (runs on port 5000 by default)
python app.py
```

### 3. Frontend Setup
Open a new terminal window.
```bash
cd frontend

# Install Node modules
npm install

# Start the React development server
npm start
```

The frontend will start on your local development server (usually `http://localhost:3000`).

---

## 📂 Folder Structure

```text
DermaAI_Project/
│
├── backend/                       # Flask API Server
│   ├── app.py                     # Main application entry point & routes
│   ├── models.py                  # SQLAlchemy Database schema models
│   ├── requirements.txt           # Python dependencies
│   ├── migrations/                # Alembic database migration files
│   └── templates/                 # (Optional) Email/HTML templates
│
├── frontend/                      # React User Interface
│   ├── public/                    # Static assets (images, icons, etc.)
│   ├── src/                       
│   │   ├── components/            # Reusable React components (Navbar, Cards)
│   │   ├── pages/                 # Full-page views
│   │   │   ├── admin/             # Admin dashboard views (ManageScans, etc.)
│   │   │   ├── user/              # User views (Profile, ScanDetails, etc.)
│   │   │   └── LandingPage.jsx    # Homepage
│   │   ├── App.jsx                # Main React router/app component
│   │   └── index.css              # Global Tailwind styling
│   ├── package.json               # NPM dependencies and scripts
│   └── tailwind.config.js         # Tailwind utility configurations
│
└── README.md                      # Project documentation
```

---

## 👨‍💻 Author / Credits

Created by **Unnati Bhavsar**. 

This project was built as part of the implementation for a next-generation dermatological AI assistant platform. Uses external technologies including React, Tailwind CSS, Python, Flask, Google Gemini, and Groq APIs.
