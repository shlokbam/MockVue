# MockVue 🎥

> Practice HireVue-style AI video interviews and get instant feedback on what you said, how you said it, and your eye contact.

---

## What is MockVue?

Companies like JPMorgan, Goldman Sachs, and TCS use HireVue for first-round interviews. MockVue gives students unlimited free practice with AI-powered feedback on:

- **Answer Quality (40pts)** — Did you hit the rubric points? Scored by Groq (Llama 3.3 70B)
- **Confidence (30pts)** — Filler words, speaking pace (WPM), long pauses
- **Eye Contact (30pts)** — Time looking at camera via face-api.js gaze detection

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite), face-api.js, Web Speech API, MediaRecorder API, Recharts |
| Backend | FastAPI, SQLAlchemy, MySQL |
| AI | Groq API (Llama 3.3 70B) |
| Auth | JWT (python-jose) + bcrypt |

---

## Setup Guide

### Prerequisites
- Node.js ≥ 18
- Python ≥ 3.10
- MySQL running locally

---

### 1. Backend Setup

```bash
cd backend

# Copy env file and fill in your values
cp .env.example .env
# Edit .env: add DB_PASSWORD and GROQ_API_KEY

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create the MySQL database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS mockvue;"

# Run the server (this auto-creates all tables)
uvicorn main:app --reload --port 8000
```

In a new terminal, seed the question bank:
```bash
cd backend
source venv/bin/activate
python seed.py
```

---

### 2. face-api.js Models

Download the required model weights (required for gaze detection):

```bash
cd frontend/public
mkdir -p models

# Download TinyFaceDetector models
curl -L -o models/tiny_face_detector_model-weights_manifest.json \
  https://cdn.jsdelivr.net/npm/face-api.js/weights/tiny_face_detector_model-weights_manifest.json

curl -L -o models/tiny_face_detector_model.weights.bin \
  https://cdn.jsdelivr.net/npm/face-api.js/weights/tiny_face_detector_model.bin

curl -L -o models/face_landmark_68_tiny_model-weights_manifest.json \
  https://cdn.jsdelivr.net/npm/face-api.js/weights/face_landmark_68_tiny_model-weights_manifest.json

curl -L -o models/face_landmark_68_tiny_model.weights.bin \
  https://cdn.jsdelivr.net/npm/face-api.js/weights/face_landmark_68_tiny_model.bin
```

Or just run the helper script (from frontend/):
```bash
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

## Environment Variables (`backend/.env`)

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=mockvue

SECRET_KEY=your-very-secret-jwt-key-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

GROQ_API_KEY=your_groq_api_key_here
```

Get a free Groq API key at: https://console.groq.com

---

## User Flow

```
Landing Page (login/register)
  → Dashboard (score trend + past sessions)
    → Company & Role Selection
      → Camera & Mic Check (face-api.js loads)
        → Live Interview
          → 30s reading phase → 2min recording
          → [background: transcription + gaze + filler words]
        → Processing (Groq scoring)
        → Feedback Report
          → Answer Quality card (rubric ✓/✗)
          → Confidence card (WPM + fillers + pauses)
          → Eye Contact card (gaze timeline)
          → Full transcript (fillers highlighted)
        → [repeat for each question]
      → Session Complete
    → Dashboard (updated)
```

---

## Question Bank

| Company | Roles |
|---------|-------|
| JPMorgan Chase | Software Engineer, Business Analyst |
| Goldman Sachs | Software Engineer |
| TCS | Software Engineer |
| Infosys | Software Engineer |
| General HR | General |

5 questions per company/role combination.

---

## API Reference

```
POST /auth/register     — Create account
POST /auth/login        — Get JWT token
GET  /auth/me           — Current user

GET  /questions?company=X&role=Y   — Get questions

POST /sessions          — Create session
GET  /sessions          — List user sessions
GET  /sessions/:id      — Get session
PATCH /sessions/:id/complete   — Finalize session

POST /answers           — Submit answer (triggers Groq)
GET  /answers/:id       — Get answer + feedback

GET  /dashboard         — Score trend data
```
