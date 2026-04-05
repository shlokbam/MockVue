from sqlalchemy import Column, Integer, String, Float, Text, DateTime, JSON, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum


class SessionStatus(str, enum.Enum):
    active = "active"
    complete = "complete"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    groq_api_key = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    sessions = relationship("Session", back_populates="user")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    company = Column(String(100), nullable=False)
    role = Column(String(100), nullable=False)
    question_text = Column(Text, nullable=False)
    rubric = Column(JSON, nullable=False)  # list of {point, points}
    model_answer = Column(Text)

    answers = relationship("Answer", back_populates="question")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    company = Column(String(100), nullable=False)
    role = Column(String(100), nullable=False)
    date = Column(DateTime(timezone=True), server_default=func.now())
    overall_score = Column(Float, default=0.0)
    status = Column(String(20), default="active")

    user = relationship("User", back_populates="sessions")
    answers = relationship("Answer", back_populates="session", cascade="all, delete-orphan")


class Answer(Base):
    __tablename__ = "answers"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    transcript = Column(Text)
    answer_score = Column(Float, default=0.0)
    confidence_score = Column(Float, default=0.0)
    eye_contact_score = Column(Float, default=0.0)
    filler_word_count = Column(Integer, default=0)
    filler_word_breakdown = Column(JSON)  # {"um": 3, "like": 2, ...}
    speaking_pace = Column(Float, default=0.0)  # WPM
    pause_count = Column(Integer, default=0)
    gaze_percentage = Column(Float, default=0.0)
    groq_feedback = Column(JSON)  # full Groq response
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("Session", back_populates="answers")
    question = relationship("Question", back_populates="answers")

    @property
    def question_text(self):
        return self.question.question_text if self.question else ""
