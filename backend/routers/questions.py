from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from typing import List
import models, schemas, random
from auth import get_current_user
from utils import get_company_logo_data

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

@router.get("/metadata")
def get_question_metadata(db: Session = Depends(get_db)):
    """
    Returns a unique list of companies and their roles for the setup page.
    """
    results = db.query(models.Question.company, models.Question.role).distinct().all()
    
    metadata = {}
    for company, role in results:
        if company not in metadata:
            metadata[company] = []
        if role not in metadata[company]:
            metadata[company].append(role)
            
    # Convert to a list of dicts for the frontend
    formatted = []
    for company, roles in metadata.items():
        branding = get_company_logo_data(company)
        
        formatted.append({
            "id": company,
            "name": company,
            "monogram": branding["monogram"],
            "color": branding["color"],
            "logo": branding["logo"],
            "roles": roles
        })
        
    return formatted
