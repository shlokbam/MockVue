import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { CheckCircle, RotateCcw, Star, AlertTriangle, Target } from 'lucide-react';
import './SessionComplete.css';

export default function SessionComplete() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(true);
  const [sessionSummary, setSessionSummary] = useState(null);

  useEffect(() => {
    finalizeSession();
  }, []);

  const finalizeSession = async () => {
    try {
      const session = JSON.parse(sessionStorage.getItem('mv_session') || 'null');
      const answers = JSON.parse(sessionStorage.getItem('mv_answers') || '[]');
      const questions = JSON.parse(sessionStorage.getItem('mv_questions') || '[]');

      if (!session) { navigate('/dashboard'); return; }

      const { data: completedSession } = await api.patch(`/sessions/${session.id}/complete`);

      const scored = answers.map((a) => ({
        ...a,
        total: (a.answer_score || 0) + (a.confidence_score || 0) + (a.eye_contact_score || 0),
        questionText: questions.find((q) => q.id === a.question_id)?.question_text || 'Unknown question',
      }));

      const sorted = scored.length > 0 ? [...scored].sort((a, b) => b.total - a.total) : [];
      const best = sorted[0] || null;
      const worst = sorted.length > 1 ? sorted[sorted.length - 1] : best;

      const avgAnswer = scored.length > 0 ? scored.reduce((s, a) => s + (a.answer_score || 0), 0) / scored.length : 0;
      const avgConfidence = scored.length > 0 ? scored.reduce((s, a) => s + (a.confidence_score || 0), 0) / scored.length : 0;
      const avgGaze = scored.length > 0 ? scored.reduce((s, a) => s + (a.eye_contact_score || 0), 0) / scored.length : 0;

      const lowestArea =
        Math.min(avgAnswer / 40, avgConfidence / 30, avgGaze / 30) === avgAnswer / 40
          ? { area: 'Answer Quality', tip: 'Focus on structuring answers with the STAR method (Situation, Task, Action, Result). Use specific numbers and project examples.' }
          : Math.min(avgConfidence / 30, avgGaze / 30) === avgConfidence / 30
          ? { area: 'Confidence', tip: 'Practise out loud daily to reduce filler words. Record yourself and listen back. Aim for 120–150 WPM.' }
          : { area: 'Eye Contact', tip: 'Place a small sticker dot above your camera lens and practise looking at it while speaking. Do 10-minute camera-stare drills.' };

      setSessionSummary({
        totalQuestions: answers.length,
        averageScore: completedSession.overall_score,
        best,
        worst,
        lowestArea,
      });

      sessionStorage.removeItem('mv_session');
      sessionStorage.removeItem('mv_questions');
      sessionStorage.removeItem('mv_q_index');
      sessionStorage.removeItem('mv_answers');
      sessionStorage.removeItem('mv_analytics');
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const scoreColor = sessionSummary?.averageScore >= 75
    ? 'var(--success)' : sessionSummary?.averageScore >= 50
    ? 'var(--warning)' : 'var(--danger)';

  if (saving) {
    return (
      <div className="page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="mesh-bg" />
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div className="spinner" style={{ width: 32, height: 32 }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Saving your session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="mesh-bg" />
      <Navbar />

      <div className="complete-wrap">
        {/* Hero */}
        <div className="complete-hero glass animate-fadeInUp">
          <div className="complete-check-ring">
            <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="40" cy="40" r="36" stroke="rgba(16,185,129,0.15)" strokeWidth="4" />
              <circle cx="40" cy="40" r="36" stroke="#10b981" strokeWidth="4"
                strokeDasharray="226" strokeDashoffset="0"
                strokeLinecap="round"
                style={{ animation: 'draw-circle 0.8s ease forwards', transformOrigin: 'center', transform: 'rotate(-90deg)' }}
              />
              <path d="M26 40l10 10 18-18" stroke="#10b981" strokeWidth="3.5"
                strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray="60" strokeDashoffset="0"
                style={{ animation: 'draw-check 0.5s 0.7s ease forwards' }}
              />
            </svg>
          </div>
          <h1>Session Complete</h1>
          <p>You answered all {sessionSummary?.totalQuestions} questions. Great work.</p>
        </div>

        {/* Stats */}
        <div className="complete-stats animate-fadeInUp">
          <div className="cs-card glass">
            <div className="cs-value">{sessionSummary?.totalQuestions}</div>
            <div className="cs-label">Questions answered</div>
          </div>
          <div className="cs-card glass">
            <div className="cs-value" style={{ color: scoreColor }}>
              {sessionSummary?.averageScore}
            </div>
            <div className="cs-label">Average score / 100</div>
          </div>
        </div>

        {/* Best / Worst */}
        {sessionSummary?.best && (
          <div className="complete-details-grid animate-fadeInUp">
            <div className="cd-card glass">
              <div className="cd-label">
                <Star size={12} style={{ display: 'inline', marginRight: 5, color: 'var(--success)' }} />
                Best question
              </div>
              <div className="cd-q">{sessionSummary?.best?.questionText}</div>
              <div className="cd-score" style={{ color: 'var(--success)' }}>
                {Math.round(sessionSummary?.best?.total || 0)}/100
              </div>
            </div>

            {sessionSummary?.worst && sessionSummary?.worst !== sessionSummary?.best && (
              <div className="cd-card glass">
                <div className="cd-label">
                  <AlertTriangle size={12} style={{ display: 'inline', marginRight: 5, color: 'var(--warning)' }} />
                  Needs work
                </div>
                <div className="cd-q">{sessionSummary?.worst?.questionText}</div>
                <div className="cd-score" style={{ color: 'var(--danger)' }}>
                  {Math.round(sessionSummary?.worst?.total || 0)}/100
                </div>
              </div>
            )}
          </div>
        )}

        {/* Priority tip */}
        {sessionSummary?.lowestArea && (
          <div className="priority-tip glass animate-fadeInUp">
            <div className="pt-header">
              <div className="pt-icon-wrap">
                <Target size={18} style={{ color: 'var(--accent-light)' }} />
              </div>
              <div>
                <div className="pt-label">Priority for next session</div>
                <div className="pt-area">{sessionSummary.lowestArea.area}</div>
              </div>
            </div>
            <p className="pt-tip">{sessionSummary.lowestArea.tip}</p>
          </div>
        )}

        <div className="complete-actions animate-fadeInUp">
          <button className="btn btn-secondary" onClick={() => navigate('/setup')}>
            <RotateCcw size={14} />
            Try another company
          </button>
          <button
            id="back-to-dashboard"
            className="btn btn-primary btn-lg"
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
