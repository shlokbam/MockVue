# MockVue 🎥

[![Vercel](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)](https://mock-vue.vercel.app)
[![Render](https://img.shields.io/badge/Backend-Render-darkblue?logo=render)](https://mockvue-backend.onrender.com)
[![TiDB Cloud](https://img.shields.io/badge/Database-TiDB_Cloud-orange?logo=mysql)](https://tidbcloud.com)
[![Groq AI](https://img.shields.io/badge/AI-Groq_Llama--3.3-green)](https://groq.com)

> Master AI-powered video interviews with instant feedback on content, confidence, and eye contact. **Now with 330+ professional questions from Google, Amazon, Microsoft, Adobe, Meta, Netflix, Flipkart, Accenture, Wipro, Zoho, Swiggy, Zomato, and Capgemini.**

---

## 🏛️ Cloud-Native Architecture

MockVue is a full-stack, cloud-native application designed for high availability and zero-cost operation on the free tier:

| Layer | Provider | Role |
|-------|----------|------|
| **Frontend** | **Vercel** | React (Vite) application with global edge delivery and SPA routing. |
| **Backend** | **Render** | Fast API (Python 3.12) with automated **Cold-Start UX Support**. |
| **Database** | **TiDB Cloud** | Serverless MySQL with 5GB free storage and persistent cloud sessions. |
| **AI Engine** | **Groq** | Llama 3.3 70B for grading & Whisper-v3-Turbo for transcription. |

---

## 🚀 Key Features

- **🎯 330+ Professional Questions**: 5 curated roles for each of the **13 Top Tech Companies**.
- **🔄 Dynamic Configuration**: The UI automatically syncs with your database. Add new questions via SQL or Seed script, and they appear in the UI instantly.
- **🛡️ Cold Start UX**: Integrated "Wake-up" system for Render. Users see a premium notification while the cloud backend spins up.
- **👁️ Eye Contact Analysis**: Real-time gaze tracking via `face-api.js` to ensure professional camera presence.
- **🗣️ Confidence Metrics**: Automated detection of filler words (um, ah, etc.), speaking pace (WPM), and silence analysis.
- **📊 Persistence**: Your session history and score trends are securely stored in TiDB Cloud.

---

## 🛠️ Production Setup Guide

### 1. Database (TiDB Cloud)
1.  Create a cluster at [tidbcloud.com](https://tidbcloud.com).
2.  Copy your **Standard Connection String** (format: `mysql+pymysql://user:pass@host:port/test`).

### 2. Backend (Render)
1.  Connect your GitHub repo to a Render Web Service.
2.  **Env Variables**: `DATABASE_URL` (TiDB string), `SECRET_KEY`, `ALGORITHM` (HS256).
3.  **Build**: `pip install -r requirements.txt`
4.  **Start**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### 3. Frontend (Vercel)
1.  Import `frontend` folder into Vercel.
2.  **Env Variables**: `VITE_API_BASE_URL` (Your Render URL).
3.  **Routing**: `vercel.json` handles SPA rewrites automatically.

---

## 🏗️ Data Management (Seeding & Diagnostics)

We provide tools to manage your cloud database safely:

### 1. Professional Seed (Safe Mode)
Populates your database with 330 questions without wiping your personal results:
```bash
cd backend
python3 seed_db.py
```

### 2. Cloud Diagnostics
Check your cloud data status (User count, Questions, Recent Sessions):
```bash
cd backend
python3 check_sessions.py
```

---

## 💻 Local Development

```bash
# Backend
cd backend && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
npm install && npm run dev
```

---

## 📖 API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/metadata` | GET | Dynamically fetch all companies/roles in the DB. |
| `/sessions` | POST/GET | Create and review searchable interview history. |
| `/answers` | POST/GET | Submit audio (WAV) for AI Pipeline evaluation. |
| `/dashboard` | GET | Get your performance trends and score averages. |

---

## 🔥 Unleash the AI
Get your free API key at [console.groq.com](https://console.groq.com) and verify it directly in the MockVue UI!
