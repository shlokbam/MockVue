# MockVue 🎥

> Master AI-powered video interviews and get instant feedback on what you said, how you said it, and your eye contact.

---

## What is MockVue?

MockVue is a premium, independent AI assessment platform designed to help students and professionals master virtual interviews. Unlike generic practice tools, MockVue replicates the experience of enterprise AI evaluators (used by firms like JPMorgan, Goldman Sachs, and TCS), providing deep analytics on:

- **Answer Quality (40pts)** — Rubric-based scoring powered by Groq (Llama 3.3 70B).
- **Confidence (30pts)** — Filler word detection, speaking pace (WPM), and long-silence analysis.
- **Eye Contact (30pts)** — Real-time gaze tracking via `face-api.js` to ensure camera presence.
- **English Transcription** — Guaranteed English feedback using Whisper Translation technology.

---

## Key Features

- **Mandatory API Activation**: A secure system that verifies your personal Groq API key (Llama 3.3 70B) before starting, ensuring evaluation is always active and stable.
- **Profile Management**: Full account control! Update your name/email, rotate your AI credentials, or change your password with mandatory verification.
- **Past Sessions & Progress**: A dedicated dashboard with searchable history and score trends to track your improvement over time.
- **Search & Filters**: Quickly find past session reports by company name or sorted by date and score.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite), face-api.js, MediaRecorder API, Recharts, Lucide Icons |
| Backend | FastAPI, SQLAlchemy (MySQL/TiDB) |
| AI Pipeline | Groq API (Llama 3.3 70B for scoring, Whisper-Large-v3-Turbo for English Translation) |
| Auth | JWT (python-jose) + bcrypt |

---

## Setup Guide

### Prerequisites
- Node.js ≥ 18
- Python ≥ 3.10
- MySQL/MariaDB running locally

---

### 1. Backend Setup

```bash
cd backend

# Copy env file and fill in your values
cp .env.example .env
# Edit .env: add DB_PASSWORD and your SECRET_KEY (GROQ_KEY is now managed per-user in UI)

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create the database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS mockvue;"

# Run the server
uvicorn main:app --reload --port 8000
```

---

### 2. face-api.js Models

Required for gaze detection. Run from the `frontend/` directory:
```bash
cd frontend
node scripts/download-models.js
```

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

---

## User Flow

```
Landing Page (login/register)
  → API Activation Overlay (mandatory one-time setup)
    → Dashboard (past history + searchable sessions)
      → Configuration (Select Company & Role)
        → Device Check (Camera, Mic, Eye Tracking, and AI Evaluator "Pre-flight")
          → Live Interview (30s Read → 2min Record)
            → Processing (Whisper Translation + Llama 3.3 Scoring)
              → Feedback Report (Quality, Confidence, Eye Contact, Transcript)
                → [continue for 5 questions]
              → Session Complete Summary
            → Dashboard (updated progress)
```

---

## API Reference

```
POST /auth/register             — Create account
POST /auth/login                — Get JWT token
GET  /auth/me                   — Current user info
PUT  /auth/profile              — Update name/email
PUT  /auth/password             — Secure password update
POST /auth/verify-api-key       — Test a raw Groq key
POST /auth/verify-stored-key    — Secure "pre-flight" AI check
PUT  /auth/api-key              — Save Groq key to user profile

GET  /questions                 — Fetch company/role specific questions

POST /sessions                  — Create practice session
GET  /sessions                  — List history (searchable)
GET  /sessions/:id              — Get aggregate results
DELETE /sessions/:id            — Remove session report

POST /answers                   — Submit audio (triggers AI Pipeline)
GET  /answers/:id               — Detailed question feedback
GET  /answers/session/:id       — All answers in a session

GET  /dashboard                 — Aggregate score stats & trends
```

---

## Environment Variables (`backend/.env`)

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=mockvue
DB_PASSWORD=your_password
DB_NAME=mockvue

SECRET_KEY=generate-a-strong-random-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

*Note: Individual users now provide their own `GROQ_API_KEY` via the UI to ensure personalized and scalable AI evaluation.*

---

## Important!

Get your free Groq API key at: [console.groq.com](https://console.groq.com)
Recommended Model: **Llama-3.3-70b-versatile**
