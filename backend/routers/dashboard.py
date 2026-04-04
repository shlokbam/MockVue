from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
import models, schemas
from auth import get_current_user
from typing import List

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=schemas.DashboardOut)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    sessions = db.query(models.Session).filter(
        models.Session.user_id == current_user.id,
        models.Session.status == "complete"
    ).order_by(models.Session.date.asc()).all()

    total = len(sessions)
    avg_score = round(sum(s.overall_score for s in sessions) / total, 1) if total else 0.0

    trend = [
        schemas.ScoreTrendPoint(
            date=s.date.strftime("%b %d"),
            score=s.overall_score,
            company=s.company
        )
        for s in sessions
    ]

    return schemas.DashboardOut(
        total_sessions=total,
        average_score=avg_score,
        score_trend=trend
    )
