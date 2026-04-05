from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from auth import get_current_user
from groq import Groq
import json, os, re
from dotenv import load_dotenv

from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/answers", tags=["answers"])

FILLER_WORDS = ["um", "uh", "like", "you know", "basically", "actually", "right", "so"]


def compute_confidence_score(filler_count: int, wpm: float, pause_count: int) -> float:
    """
    Max 30pts:
    - Filler words: 15pts base, -1.5 per filler (min 0)
    - WPM: 8pts, ideal 120-150 WPM
    - Pauses >3s: 7pts base, -2 per pause (min 0)
    """
    # Filler score
    filler_score = max(0.0, 15.0 - filler_count * 1.5)

    # WPM score
    if 120 <= wpm <= 150:
        wpm_score = 8.0
    elif wpm == 0:
        wpm_score = 0.0
    else:
        distance = min(abs(wpm - 120), abs(wpm - 150))
        wpm_score = max(0.0, 8.0 - distance * 0.1)

    # Pause score
    pause_score = max(0.0, 7.0 - pause_count * 2.0)

    return round(filler_score + wpm_score + pause_score, 1)


def compute_eye_contact_score(gaze_percentage: float) -> float:
    """Max 30pts: gaze% * 0.3"""
    return round(min(30.0, gaze_percentage * 0.3), 1)


def call_groq(question_text: str, rubric: list, transcript: str, api_key: str) -> dict:
    client = Groq(api_key=api_key)

    rubric_text = "\n".join(
        f"- {r['point']} (worth {r['points']} points)" for r in rubric
    )
    total_points = sum(r["points"] for r in rubric)

    system_prompt = """You are a professional interview evaluator. Analyse the student's answer to the interview question and score it against the rubric. Return ONLY valid JSON, no extra text."""

    user_prompt = f"""Interview Question: {question_text}

Rubric (total {total_points} points):
{rubric_text}

Student's Answer: {transcript}

Score each rubric point and provide specific feedback. Return JSON in exactly this format:
{{
  "rubric_scores": [
    {{"point": "rubric point text", "score": N, "max": N, "feedback": "specific feedback"}}
  ],
  "overall_feedback": "2-3 sentences of specific, actionable feedback",
  "summary": "one sentence summary of the answer quality",
  "total_answer_score": N
}}"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3,
            max_tokens=1024
        )
        raw = response.choices[0].message.content.strip()
        # Extract JSON if wrapped in code blocks
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if match:
            return json.loads(match.group())
        return json.loads(raw)
    except Exception as e:
        # Fallback structure if Groq fails
        return {
            "rubric_scores": [
                {"point": r["point"], "score": 0, "max": r["points"], "feedback": "Could not evaluate."}
                for r in rubric
            ],
            "overall_feedback": "Could not evaluate your answer at this time. Please try again.",
            "summary": "Evaluation unavailable.",
            "total_answer_score": 0
        }


@router.post("", response_model=schemas.AnswerOut)
def submit_answer(
    session_id: int = Form(...),
    question_id: int = Form(...),
    gaze_percentage: float = Form(0.0),
    transcript: str = Form(""),
    filler_word_count: int = Form(0),
    speaking_pace: float = Form(0.0),
    pause_count: int = Form(0),
    filler_word_breakdown: str = Form("{}"),
    audio: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Process audio if provided
    if audio:
        try:
            # Use user key, fallback to system key
            api_key = current_user.groq_api_key or os.getenv("GROQ_API_KEY")
            if not api_key:
                raise Exception("No Groq API Key found for transcription.")

            client = Groq(api_key=api_key)
            audio_data = audio.file.read()
            filename = audio.filename or "recording.webm"
            # Some platforms might pass an empty file, check size
            if len(audio_data) > 0:
                transcription = client.audio.translations.create(
                    file=(filename, audio_data),
                    model="whisper-large-v3-turbo",
                    response_format="verbose_json"
                )
                
                # Overwrite transcript with reliable backend transcription
                result_text = transcription.text.strip()
                if result_text:
                    transcript = result_text

                # Recompute fillers, WPM, and pauses locally
                segments = getattr(transcription, "segments", [])
                duration = getattr(transcription, "duration", 0)

                # Word count
                words = [w for w in re.split(r'\s+', transcript.lower()) if w]
                word_count = len(words)
                
                # Determine duration from segments if not directly provided
                if duration == 0 and segments:
                    duration = segments[-1]["end"]
                
                # Recompute WPM
                minutes = duration / 60.0
                if minutes > 0:
                    speaking_pace = round(word_count / minutes)

                # Count pauses > 3s
                current_pause_count = 0
                for i in range(1, len(segments)):
                    if segments[i]["start"] - segments[i-1]["end"] >= 3.0:
                        current_pause_count += 1
                pause_count = current_pause_count

                # Recompute fillers
                breakdown = {}
                current_filler_count = 0
                lower_transcript = transcript.lower()
                for fw in FILLER_WORDS:
                    # simplistic regex for filler words
                    matches = len(re.findall(r'\b' + fw + r'\b', lower_transcript))
                    if matches > 0:
                        breakdown[fw] = matches
                        current_filler_count += matches
                
                filler_word_count = current_filler_count
                filler_word_breakdown = json.dumps(breakdown)

        except Exception as e:
            print(f"Backend Audio Transcription failed: {e}")
            # Fall back to frontend data if whisper fails

    # Validate session ownership
    session = db.query(models.Session).filter(
        models.Session.id == session_id,
        models.Session.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Fetch question
    question = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Call Groq for answer scoring (Use user key, fallback to system key)
    api_key = current_user.groq_api_key or os.getenv("GROQ_API_KEY")
    if not api_key:
         raise HTTPException(status_code=400, detail="No Groq API Key found. Please add one in your Profile.")

    groq_result = call_groq(
        question_text=question.question_text,
        rubric=question.rubric,
        transcript=transcript,
        api_key=api_key
    )

    # Compute component scores
    answer_score = min(40.0, float(groq_result.get("total_answer_score", 0)))
    confidence_score = compute_confidence_score(
        filler_word_count, speaking_pace, pause_count
    )
    eye_contact_score = compute_eye_contact_score(gaze_percentage)

    # Save answer
    answer = models.Answer(
        session_id=session_id,
        question_id=question_id,
        transcript=transcript,
        answer_score=answer_score,
        confidence_score=confidence_score,
        eye_contact_score=eye_contact_score,
        filler_word_count=filler_word_count,
        filler_word_breakdown=json.loads(filler_word_breakdown),
        speaking_pace=speaking_pace,
        pause_count=pause_count,
        gaze_percentage=gaze_percentage,
        groq_feedback=groq_result
    )
    db.add(answer)
    db.flush() # Ensure answer is visible to query before recalculation
    
    # NEW: Recalculate and update the session's overall score in real-time
    answers = db.query(models.Answer).filter(models.Answer.session_id == session_id).all()
    if answers:
        total = sum(
            (a.answer_score or 0) + (a.confidence_score or 0) + (a.eye_contact_score or 0)
            for a in answers
        )
        session.overall_score = round(total / len(answers), 1)

    db.commit()
    db.refresh(answer)
    return answer


@router.get("/session/{session_id}", response_model=list[schemas.AnswerOut])
def get_answers_for_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Verify session belongs to user
    session = db.query(models.Session).filter(
        models.Session.id == session_id,
        models.Session.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    answers = db.query(models.Answer).filter(
        models.Answer.session_id == session_id
    ).order_by(models.Answer.id.asc()).all()
    return answers


@router.get("/{answer_id}", response_model=schemas.AnswerOut)
def get_answer(
    answer_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    answer = db.query(models.Answer).join(models.Session).filter(
        models.Answer.id == answer_id,
        models.Session.user_id == current_user.id
    ).first()
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")
    return answer
