from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models
from routers import auth, questions, sessions, answers, dashboard, feedback

# Create all tables
Base.metadata.create_all(bind=engine)

from fastapi import FastAPI, Request
import time

app = FastAPI(title="MockVue API", version="1.0.0")

# Request Logger Middleware for stability debugging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    print(f"DEBUG: {request.method} {request.url.path} - {response.status_code} ({duration:.2f}s)")
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://mock-vue.vercel.app", 
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(questions.router)
app.include_router(sessions.router)
app.include_router(answers.router)
app.include_router(dashboard.router)
app.include_router(feedback.router)


@app.api_route("/", methods=["GET", "HEAD"])
def root():
    return {"message": "MockVue API is running", "version": "1.0.0"}
