from database import SessionLocal
import models

db = SessionLocal()
try:
    # Get the most recent sessions for the user
    sessions = db.query(models.Session).order_by(models.Session.id.desc()).limit(5).all()
    print("--- RECENT SESSIONS ---")
    for s in sessions:
        ans_count = db.query(models.Answer).filter(models.Answer.session_id == s.id).count()
        print(f"ID: {s.id} | Company: {s.company} | Status: {s.status} | Answers: {ans_count} | Created: {s.date}")
finally:
    db.close()
