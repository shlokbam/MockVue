import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import models

# Import engine and Base from database.py to ensure SSL and schema are correct
from database import engine, Base, DATABASE_URL

# Standard Questions for Seeding
# Note: Pydantic schema expects 'points' (int) instead of 'weight' (float)
DEFAULT_RUBRIC = [
    {"point": "Clarity of communication", "points": 10},
    {"point": "Technical accuracy", "points": 10},
    {"point": "Confidence and body language", "points": 10}
]

QUESTIONS_DATA = [
    # General HR
    {"company": "General HR", "role": "Software Engineer", "question_text": "Tell me about yourself and your background.", "rubric": DEFAULT_RUBRIC, "model_answer": "Focus on your journey, key projects, and why you love coding."},
    {"company": "General HR", "role": "Software Engineer", "question_text": "Why do you want to work for our company?", "rubric": DEFAULT_RUBRIC, "model_answer": "Mention specific company values or products that excite you."},
    {"company": "General HR", "role": "Software Engineer", "question_text": "What is your greatest professional achievement?", "rubric": DEFAULT_RUBRIC, "model_answer": "Use the STAR method: Situation, Task, Action, Result."},
    {"company": "General HR", "role": "Software Engineer", "question_text": "Describe a difficult work situation and how you handled it.", "rubric": DEFAULT_RUBRIC, "model_answer": "Focus on conflict resolution and professionalism."},
    {"company": "General HR", "role": "Software Engineer", "question_text": "Where do you see yourself in five years?", "rubric": DEFAULT_RUBRIC, "model_answer": "Show ambition but also commitment to learning and growth."},
    
    # Google
    {"company": "Google", "role": "Software Engineer", "question_text": "How would you explain the concept of Cloud Computing to a 6-year-old?", "rubric": DEFAULT_RUBRIC, "model_answer": "Use analogies like 'borrowing someone else's big computer via a long cable'."},
    {"company": "Google", "role": "Software Engineer", "question_text": "What is your favorite Google product and how would you improve it?", "rubric": DEFAULT_RUBRIC, "model_answer": "Identify a specific pain point and propose a scalable solution."},
    
    # Amazon
    {"company": "Amazon", "role": "Software Engineer", "question_text": "Tell me about a time you had to deal with a difficult customer.", "rubric": DEFAULT_RUBRIC, "model_answer": "Focus on 'Customer Obsession' and de-escalation."},

    # Adobe
    {"company": "Adobe", "role": "Software Engineer", "question_text": "If you were to redesign the UI of Photoshop, what is the first thing you would change?", "rubric": DEFAULT_RUBRIC, "model_answer": "Focus on accessibility and workspace efficiency."},
    {"company": "Adobe", "role": "Software Engineer", "question_text": "Tell me about a time you had to work on a creative project with tight deadlines.", "rubric": DEFAULT_RUBRIC, "model_answer": "Explain how you prioritized features to ensure a timely delivery."},
    {"company": "Adobe", "role": "Software Engineer", "question_text": "How do you handle technical debt in a fast-paced environment?", "rubric": DEFAULT_RUBRIC, "model_answer": "Discuss the balance between speed and sustainable code quality."},
    {"company": "Adobe", "role": "Software Engineer", "question_text": "Why Adobe? What draws you to our creative suite?", "rubric": DEFAULT_RUBRIC, "model_answer": "Connect your passion for tech with Adobe's mission to enable creativity."},
    {"company": "Adobe", "role": "Software Engineer", "question_text": "Which Adobe product do you think has the best user experience and why?", "rubric": DEFAULT_RUBRIC, "model_answer": "Pick a product like Figma or Lightroom and explain the UX principles used."},

    # Meta
    {"company": "Meta", "role": "Software Engineer", "question_text": "How would you build a simplified version of the Facebook news feed?", "rubric": DEFAULT_RUBRIC, "model_answer": "Discuss system design, scalability, and ranking algorithms."},
    {"company": "Meta", "role": "Software Engineer", "question_text": "What are your thoughts on the future of the Metaverse?", "rubric": DEFAULT_RUBRIC, "model_answer": "Show awareness of AR/VR trends and social connection."},
]

def seed():
    # Ensure tables exist (using secure engine)
    Base.metadata.create_all(bind=engine)
    
    Session = sessionmaker(bind=engine)
    db = Session()
    
    try:
        print(f"Seeding database at: {DATABASE_URL.split('@')[-1]}")
        
        # Clear existing questions to start fresh
        db.query(models.Question).delete()
        
        for q in QUESTIONS_DATA:
            new_q = models.Question(**q)
            db.add(new_q)
        
        db.commit()
        print(f"Successfully seeded {len(QUESTIONS_DATA)} questions with the correct 'points' schema!")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
