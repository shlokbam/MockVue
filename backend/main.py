from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models
from routers import auth, questions, sessions, answers, dashboard, feedback

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="MockVue API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    # Allow all origins for the initial multi-cloud deployment to prevent CORS errors.
    allow_origins=["*"], 
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


@app.get("/")
def root():
    return {"message": "MockVue API is running", "version": "1.0.0"}
