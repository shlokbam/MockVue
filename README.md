# MockVue 🎥

[![Vercel](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)](https://mock-vue.vercel.app)
[![Render](https://img.shields.io/badge/Backend-Render-darkblue?logo=render)](https://mockvue-backend.onrender.com)
[![TiDB Cloud](https://img.shields.io/badge/Database-TiDB_Cloud-orange?logo=mysql)](https://tidbcloud.com)
[![Groq AI](https://img.shields.io/badge/AI-Groq_Llama--3.3-green)](https://groq.com)

> Master AI-powered video interviews with instant feedback on content, confidence, and eye contact. **Now with 200+ professional questions from Google, Amazon, Adobe, and more.**

---

## 🏛️ Cloud-Native Architecture

MockVue has been professionally architected to run entirely in the cloud using a high-performance, cost-effective stack:

| Layer | Provider | Role |
|-------|----------|------|
| **Frontend** | **Vercel** | High-speed global delivery of the React/Vite application. |
| **Backend** | **Render** | Secure FastAPI Python 3.12 environment with dynamic scaling. |
| **Database** | **TiDB Cloud** | Serverless MySQL-compatible database for persistent cloud storage. |
| **AI Evaluation** | **Groq** | Ultra-fast inference (Llama 3.3 70B) for real-time assessment. |

---

## 🚀 Key Features

- **🎯 200+ Professional Questions**: Curated behavioral and technical questions for **15+ Top Tech Companies** (Adobe, Netflix, Google, Meta, etc.).
- **👁️ Real-time Eye Contact Analysis**: Integrated `face-api.js` to ensure you maintain camera presence during your response.
- **🗣️ Confidence Tracking**: Automatic detection of filler words (um, ah, like), speaking pace (WPM), and long pauses.
- **✍️ Automated Grading**: Detailed feedback based on a professional rubric, including model answers for every question.
- **🔒 Secure API Key Management**: Each user can safely provide and verify their own Groq API key directly in the UI.
- **📊 Performance Dashboard**: Track your score trends and review searchable session reports from past mock interviews.

---

## 🛠️ Production Setup Guide

### 1. Database (TiDB Cloud Serverless)
1.  Create a free account at [tidbcloud.com](https://tidbcloud.com).
2.  Create a **Serverless Tier** cluster named `mockvue`.
3.  Go to **Connect** and copy your **Standard Connection String** (format: `mysql+pymysql://user:password@host:port/test`).

### 2. Backend (Render)
1.  Create a **Web Service** on Render connected to your GitHub repo.
2.  **Environment**: Python 3.
3.  **Build Command**: `pip install -r requirements.txt`
4.  **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5.  **Environment Variables**:
    - `DATABASE_URL`: Your full TiDB connection string.
    - `SECRET_KEY`: A random strong string for JWT.
    - `ALGORITHM`: `HS256`
    - `ACCESS_TOKEN_EXPIRE_MINUTES`: `10080` (7 days)

### 3. Frontend (Vercel)
1.  Import your GitHub repo into Vercel.
2.  **Framework Preset**: Vite.
3.  **Root Directory**: `frontend`.
4.  **Environment Variables**:
    - `VITE_API_BASE_URL`: Your Render service URL (e.g., `https://your-api.onrender.com`).

---

## 🏗️ Initializing Professional Questions (Seeding)

MockVue comes with a pre-curated set of 200+ professional questions. To populate your cloud database:

1.  Open your local `backend/.env` and update the `DATABASE_URL` with your TiDB link.
2.  Run the seed script:
    ```bash
    cd backend
    source venv/bin/activate
    python3 seed_db.py
    ```

---

## 💻 Local Development

If you prefer to run MockVue locally:

### 1. Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 📖 API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth` | POST/PUT | Authentication, Password Management, and API Key Verification. |
| `/questions` | GET | Fetch role-specific questions for 15+ companies. |
| `/sessions` | POST/GET | Manage interview sessions and history. |
| `/answers` | POST/GET | Submit audio transcript for AI evaluation & view report. |
| `/dashboard` | GET | Fetch aggregate performance stats. |
| `/feedback` | POST | User feedback and bug reporting. |

---

## 🔥 Get Your API Key
To unleash the full power of MockVue, get a free Groq API key at [console.groq.com](https://console.groq.com).

**Recommended Model:** `Llama-3.3-70b-versatile` or `Whisper-Large-v3-Turbo`
