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
    # 1. Get totals and averages via SQL (much faster than Python)
    stats = db.query(
        func.count(models.Session.id),
        func.avg(models.Session.overall_score)
    ).filter(
        models.Session.user_id == current_user.id,
        (models.Session.status == "complete") | (models.Session.overall_score > 0)
    ).first()

    total = stats[0] or 0
    avg_score = round(float(stats[1]), 1) if stats[1] is not None else 0.0

    # 2. Get trend data (optimized to only select what we need)
    sessions = db.query(
        models.Session.id, 
        models.Session.date, 
        models.Session.overall_score, 
        models.Session.company
    ).filter(
        models.Session.user_id == current_user.id,
        (models.Session.status == "complete") | (models.Session.overall_score > 0)
    ).order_by(models.Session.date.asc()).all()

    trend = [
        schemas.ScoreTrendPoint(
            id=s.id,
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
