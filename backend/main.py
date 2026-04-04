from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models
from routers import auth, questions, sessions, answers, dashboard

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="MockVue API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(questions.router)
app.include_router(sessions.router)
app.include_router(answers.router)
app.include_router(dashboard.router)


@app.get("/")
def root():
    return {"message": "MockVue API is running", "version": "1.0.0"}
