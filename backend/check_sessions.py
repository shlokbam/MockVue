import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import models
from database import engine, DATABASE_URL

def check_data():
    Session = sessionmaker(bind=engine)
    db = Session()
    
    try:
        print(f"--- ☁️ TiDB Cloud Status ---")
        print(f"Connection: {DATABASE_URL.split('@')[-1]}")
        
        user_count = db.query(models.User).count()
        session_count = db.query(models.Session).count()
        answer_count = db.query(models.Answer).count()
        question_count = db.query(models.Question).count()
        
        print(f"👤 Users: {user_count}")
        print(f"🎬 Sessions: {session_count}")
        print(f"🎤 Answers: {answer_count}")
        print(f"📚 Questions: {question_count}")
        
        if session_count > 0:
            print("\n--- 🏁 Recent Sessions ---")
            recent = db.query(models.Session).order_by(models.Session.date.desc()).limit(5).all()
            for s in recent:
                print(f"[{s.date}] {s.company} - {s.role} (Score: {s.overall_score})")
        else:
            print("\n⚠️ No sessions found in the cloud database.")

    except Exception as e:
        print(f"Error checking data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_data()
