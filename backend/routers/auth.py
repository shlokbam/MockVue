from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from auth import verify_password, hash_password, create_access_token, get_current_user
from groq import Groq

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=schemas.Token)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = hash_password(user_data.password)
    user = models.User(name=user_data.name, email=user_data.email, hashed_password=hashed)
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": schemas.UserOut.from_orm(user)}


@router.post("/login", response_model=schemas.Token)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": schemas.UserOut.from_orm(user)}


@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(get_current_user)):
    return schemas.UserOut.from_orm(current_user)


@router.put("/profile", response_model=schemas.UserOut)
def update_profile(
    data: schemas.ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if data.name:
        current_user.name = data.name
    if data.email:
        # Check if email is already taken
        if data.email != current_user.email:
            existing = db.query(models.User).filter(models.User.email == data.email).first()
            if existing:
                raise HTTPException(status_code=400, detail="Email already taken")
            current_user.email = data.email
    
    db.commit()
    db.refresh(current_user)
    return schemas.UserOut.from_orm(current_user)


@router.put("/password")
def change_password(
    data: schemas.PasswordChange,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    
    current_user.hashed_password = hash_password(data.new_password)
    db.commit()
    return {"message": "Password updated successfully"}


@router.post("/verify-api-key")
def verify_api_key(data: schemas.ApiKeyVerify):
    """Tests if the provided Groq key works by making a tiny request."""
    try:
        client = Groq(api_key=data.api_key)
        client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": "ping"}],
            max_tokens=5
        )
        return {"success": True, "message": "API key is valid"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid API Key: {str(e)}")


@router.post("/verify-stored-key")
def verify_stored_key(current_user: models.User = Depends(get_current_user)):
    """Tests if the stored Groq key works."""
    if not current_user.groq_api_key:
        raise HTTPException(status_code=400, detail="No API Key stored")
    
    try:
        client = Groq(api_key=current_user.groq_api_key)
        client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": "ping"}],
            max_tokens=2
        )
        return {"success": True, "message": "Stored API key is valid"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Stored API Key is invalid: {str(e)}")


@router.put("/api-key", response_model=schemas.UserOut)
def save_api_key(
    data: schemas.ApiKeySave,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    current_user.groq_api_key = data.api_key
    db.commit()
    db.refresh(current_user)
    return schemas.UserOut.from_orm(current_user)
