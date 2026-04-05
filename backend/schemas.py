from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


# ─── Auth ────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    name: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    has_api_key: bool = False
    created_at: datetime

    @classmethod
    def from_orm(cls, obj):
        return cls(
            id=obj.id,
            name=obj.name,
            email=obj.email,
            has_api_key=bool(obj.groq_api_key),
            created_at=obj.created_at
        )

    class Config:
        from_attributes = True


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class ApiKeyVerify(BaseModel):
    api_key: str


class ApiKeySave(BaseModel):
    api_key: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


# ─── Questions ────────────────────────────────────────────────────────────────

class RubricPoint(BaseModel):
    point: str
    points: int


class QuestionOut(BaseModel):
    model_config = {"protected_namespaces": (), "from_attributes": True}

    id: int
    company: str
    role: str
    question_text: str
    rubric: List[RubricPoint]
    model_answer: Optional[str]


# ─── Sessions ────────────────────────────────────────────────────────────────

class SessionCreate(BaseModel):
    company: str
    role: str


class SessionOut(BaseModel):
    id: int
    user_id: int
    company: str
    role: str
    date: datetime
    overall_score: float
    status: str

    class Config:
        from_attributes = True


# ─── Answers ─────────────────────────────────────────────────────────────────

class AnswerSubmit(BaseModel):
    session_id: int
    question_id: int
    transcript: str
    filler_word_breakdown: dict  # {"um": 3, "like": 2, ...}
    filler_word_count: int
    speaking_pace: float          # WPM
    pause_count: int
    gaze_percentage: float        # 0–100


class RubricScore(BaseModel):
    point: str
    score: float
    max: float
    feedback: str


class GroqFeedback(BaseModel):
    rubric_scores: List[RubricScore]
    overall_feedback: str
    summary: str
    total_answer_score: float


class AnswerOut(BaseModel):
    id: int
    session_id: int
    question_id: int
    transcript: str
    answer_score: float
    confidence_score: float
    eye_contact_score: float
    filler_word_count: int
    filler_word_breakdown: Optional[Any]
    speaking_pace: float
    pause_count: int
    gaze_percentage: float
    groq_feedback: Optional[Any]
    question_text: str
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Dashboard ───────────────────────────────────────────────────────────────

class ScoreTrendPoint(BaseModel):
    id: int
    date: str
    score: float
    company: str


class DashboardOut(BaseModel):
    total_sessions: int
    average_score: float
    score_trend: List[ScoreTrendPoint]


# ─── Feedback ────────────────────────────────────────────────────────────────

class FeedbackCreate(BaseModel):
    category: str
    subject: str
    message: str


class FeedbackOut(BaseModel):
    id: int
    user_id: int
    category: str
    subject: str
    message: str
    created_at: datetime

    class Config:
        from_attributes = True
