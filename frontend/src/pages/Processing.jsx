import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Check, Circle } from 'lucide-react';
import './Processing.css';

const STEPS = [
  { label: 'Transcribing your answer', delay: 1000 },
  { label: 'Scoring your content', delay: 3000 },
  { label: 'Calculating confidence and eye contact', delay: 5500 },
];

export default function Processing() {
  const navigate = useNavigate();
  const [completedSteps, setCompletedSteps] = useState([]);
  const [error, setError] = useState('');
  const isMountedRef = useRef(true);
  const hasSubmitted = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    // Timers should run even if a submission is already in flight (StrictMode mount 2)
    const timers = STEPS.map((step, i) =>
      setTimeout(() => {
        if (isMountedRef.current) {
          setCompletedSteps((prev) => [...prev, i]);
        }
      }, step.delay)
    );

    if (!hasSubmitted.current) {
      hasSubmitted.current = true;
      submitAnswer();
    }

    return () => {
      isMountedRef.current = false;
      timers.forEach(clearTimeout);
    };
  }, []);

  const submitAnswer = async () => {
    const session = JSON.parse(sessionStorage.getItem('mv_session') || 'null');
    const questions = JSON.parse(sessionStorage.getItem('mv_questions') || '[]');
    const qIndex = parseInt(sessionStorage.getItem('mv_q_index') || '0');
    const analytics = JSON.parse(sessionStorage.getItem('mv_analytics') || '{}');
    const question = questions[qIndex];

    if (!session || !question) { navigate('/dashboard'); return; }

    try {
      const formData = new FormData();
      formData.append('session_id', session.id);
      formData.append('question_id', question.id);
      formData.append('gaze_percentage', analytics.gaze_percentage || 0);

      // Append local fallbacks in case audio fails or isn't present
      formData.append('transcript', analytics.transcript || '');
      formData.append('filler_word_breakdown', JSON.stringify(analytics.filler_word_breakdown || {}));
      formData.append('filler_word_count', analytics.filler_word_count || 0);
      formData.append('speaking_pace', analytics.speaking_pace || 0);
      formData.append('pause_count', analytics.pause_count || 0);

      if (window.mv_audio_blob) {
        let ext = 'webm';
        if (window.mv_audio_blob.type.includes('mp4')) ext = 'mp4';
        else if (window.mv_audio_blob.type.includes('ogg')) ext = 'ogg';
        
        formData.append('audio', window.mv_audio_blob, `audio.${ext}`);
        window.mv_audio_blob = null; // clear after sending
      }

      const { data: answer } = await api.post('/answers', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!isMountedRef.current) return;

      sessionStorage.removeItem('mv_analytics');

      const prevAnswers = JSON.parse(sessionStorage.getItem('mv_answers') || '[]');
      prevAnswers.push(answer);
      sessionStorage.setItem('mv_answers', JSON.stringify(prevAnswers));

      await new Promise((res) => setTimeout(res, 6500));

      if (isMountedRef.current) {
        navigate(`/report/${answer.id}`);
      }
    } catch (e) {
      if (isMountedRef.current) {
        console.error(e);
        setError('Something went wrong. Please check your connection and try again.');
      }
    }
  };

  return (
    <div className="processing-page">
      <div className="mesh-bg" />

      <div className="processing-content animate-fadeIn">
        <div className="proc-logo">
          <div className="proc-logo-ring" />
          <span>MV</span>
        </div>

        <h1>Analysing your response</h1>
        <p>Our AI is reviewing what you said and how you said it.</p>

        <div className="proc-steps">
          {STEPS.map((step, i) => {
            const done = completedSteps.includes(i);
            const active = !done && completedSteps.length === i;
            return (
              <div
                key={i}
                className={`proc-step ${done ? 'done' : active ? 'active' : 'pending'}`}
              >
                <div className="proc-step-icon">
                  {done
                    ? <Check size={14} strokeWidth={2.5} />
                    : active
                    ? <div className="spinner" style={{ width: 14, height: 14 }} />
                    : <Circle size={14} strokeWidth={1.5} style={{ opacity: 0.35 }} />
                  }
                </div>
                <span>{step.label}</span>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="proc-error">
            <span>{error}</span>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
