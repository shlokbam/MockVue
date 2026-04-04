from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from typing import List
import models, schemas, random
from auth import get_current_user

router = APIRouter(prefix="/questions", tags=["questions"])


@router.get("", response_model=List[schemas.QuestionOut])
def get_questions(
    company: str = Query(...),
    role: str = Query(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    questions = db.query(models.Question).filter(
        models.Question.company == company,
        models.Question.role == role
    ).all()

    # Fallback to General HR questions if none found for this company/role
    if not questions:
        questions = db.query(models.Question).filter(
            models.Question.company == "General HR"
        ).all()

    if not questions:
        raise HTTPException(status_code=404, detail="No questions found. Please seed the database.")

    # Shuffle for variety and limit to 5
    random.shuffle(questions)
    return questions[:5]

