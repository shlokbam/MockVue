import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import './FeedbackReport.css';

function ScoreRing({ score, max = 100, size = 160 }) {
  const radius = (size - 20) / 2;
  const circ = 2 * Math.PI * radius;
  const fill = Math.max(0, Math.min(1, score / max));
  const dashOffset = circ * (1 - fill);

  const color =
    score >= 75 ? '#10b981' :
    score >= 50 ? '#f59e0b' :
    '#ef4444';

  return (
    <div className="score-ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease', filter: `drop-shadow(0 0 8px ${color}60)` }}
        />
      </svg>
      <div className="ring-inner">
        <div className="ring-score" style={{ color }}>{Math.round(score)}</div>
        <div className="ring-max">/ {max}</div>
      </div>
    </div>
  );
}

function ProgressBar({ value, max, color }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="progress-bar-wrap">
      <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color || 'var(--accent-gradient)' }} />
    </div>
  );
}

const QUALITY_WORDS = [
  'team', 'growth', 'challenge', 'results', 'impact', 
  'framework', 'strategy', 'develop', 'developed', 'lead', 'led', 
  'managed', 'improve', 'improved', 'achieve', 'achieved', 
  'tcs', 'technology', 'technologies', 'leadership', 'communicate',
  'scalable', 'deploy', 'collaborate', 'collaborated', 'agile', 
  'learning', 'learn', 'metrics', 'optimize', 'optimized',
  'giant', 'project', 'sector', 'india', 'future', 'server', 'ai'
];

function highlightTranscript(text, breakdown) {
  if (!text) return text;
  let result = text;
  
  // Highlight filler words (amber)
  if (breakdown) {
    Object.keys(breakdown).forEach((fw) => {
      // Use negative lookbehind/lookahead to avoid matching inside HTML tags
      const regex = new RegExp(`(?<!<[^>]*)\\b(${fw})\\b(?![^<]*>)`, 'gi');
      result = result.replace(regex, `<mark class="filler-highlight">$1</mark>`);
    });
  }

  // Highlight quality words (green)
  QUALITY_WORDS.forEach((qw) => {
    const regex = new RegExp(`(?<!<[^>]*)\\b(${qw})\\b(?![^<]*>)`, 'gi');
    result = result.replace(regex, `<mark class="quality-highlight">$1</mark>`);
  });

  return result;
}

function WpmGauge({ wpm }) {
  const pct = Math.min(100, (wpm / 250) * 100);
  const ideal = wpm >= 120 && wpm <= 150;
  return (
    <div className="wpm-gauge-wrap">
      <div className="wpm-track">
        <div className="wpm-fill" style={{ width: `${pct}%` }} />
        <div className="wpm-ideal-zone" />
      </div>
      <div className="wpm-labels">
        <span>0</span>
        <span style={{ color: 'var(--success)', fontSize: 11 }}>120–150 ideal</span>
        <span>250+</span>
      </div>
      <div className={`wpm-badge-large ${ideal ? 'ideal' : 'out-of-range'}`}>
        {wpm} WPM — {ideal ? '✓ Ideal pace' : wpm < 120 ? 'Too slow' : 'Too fast'}
      </div>
    </div>
  );
}

function GazeTimeline({ gazePercent }) {
  // Simulate a timeline with approximate distribution
  const segments = 40;
  return (
    <div>
      <div className="gaze-timeline">
        {Array.from({ length: segments }).map((_, i) => {
          const looking = Math.random() < gazePercent / 100;
          return (
            <div
              key={i}
              className={`gaze-seg ${looking ? 'looking' : 'away'}`}
              title={looking ? 'Looking at camera' : 'Looking away'}
            />
          );
        })}
      </div>
      <div className="gaze-legend">
        <span className="gaze-legend-item looking">Looking at camera</span>
        <span className="gaze-legend-item away">Looking away</span>
      </div>
    </div>
  );
}

export default function FeedbackReport() {
  const { answerId } = useParams();
  const navigate = useNavigate();
  const [answer, setAnswer] = useState(null);
  const [question, setQuestion] = useState(null);
  const [sessionSiblings, setSessionSiblings] = useState([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data: ans } = await api.get(`/answers/${answerId}`);
        setAnswer(ans);

        // Fetch sibling answers for navigation
        const { data: siblings } = await api.get(`/answers/session/${ans.session_id}`);
        setSessionSiblings(siblings.sort((a, b) => a.id - b.id));

        const questions = JSON.parse(sessionStorage.getItem('mv_questions') || '[]');
        setTotalQuestions(questions.length);
        const q = questions.find((q) => q.id === ans.question_id);
        setQuestion(q || null);
      } catch (e) {
        setError('Could not load your feedback. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, [answerId]);

  const handleNextQuestion = () => {
    const questions = JSON.parse(sessionStorage.getItem('mv_questions') || '[]');
    const qIndex = parseInt(sessionStorage.getItem('mv_q_index') || '0');

    if (qIndex + 1 >= questions.length) {
      // Session complete
      navigate('/session-complete');
    } else {
      // Advance index and go straight to interview (camera already granted)
      sessionStorage.setItem('mv_q_index', String(qIndex + 1));
      sessionStorage.removeItem('mv_analytics');
      navigate('/interview');
    }
  };

  const handleTryAgain = () => {
    // Clear stale analytics so Processing doesn't re-use old data
    sessionStorage.removeItem('mv_analytics');
    navigate('/interview');
  };

  if (loading) {
    return (
      <div className="page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="mesh-bg" />
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  if (error || !answer) {
    return (
      <div className="page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="mesh-bg" />
        <div style={{ textAlign: 'center', color: 'var(--danger)' }}>{error}</div>
      </div>
    );
  }

  const groq = answer.groq_feedback || {};
  const rubricScores = groq.rubric_scores || [];
  const totalScore = (answer.answer_score || 0) + (answer.confidence_score || 0) + (answer.eye_contact_score || 0);
  const fillerBreakdown = answer.filler_word_breakdown || {};

  const scoreColor = totalScore >= 75 ? '#10b981' : totalScore >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="page">
      <div className="mesh-bg" />
      <Navbar />

      <div className="report-wrap">
        {/* Question header */}
        <div className="report-nav-header animate-fadeInUp">
          <div className="report-breadcrumb" onClick={() => navigate(`/session/${answer.session_id}`)}>
            ← Back to Session Summary
          </div>
          <div className="report-question-header glass animate-fadeInUp">
            <div className="report-q-label">Question focus</div>
            <div className="report-q-text">"{answer.question_text}"</div>
          </div>
        </div>

        {/* ── Overall Score ──────────────────────────────────────────────────── */}
        <div className="overall-card glass animate-fadeInUp">
          <ScoreRing score={totalScore} size={160} />
          <div className="overall-right">
            <h1>Overall Score</h1>
            <div
              className="score-summary-badge"
              style={{ borderColor: scoreColor + '40', background: scoreColor + '15', color: scoreColor }}
            >
              {totalScore >= 75 ? '🟢 Strong performance' :
               totalScore >= 50 ? '🟡 Needs improvement' :
               '🔴 Significant gaps'}
            </div>
            {groq.summary && (
              <p className="overall-summary">"{groq.summary}"</p>
            )}
          </div>
        </div>

        {/* ── Score cards row ─────────────────────────────────────────────────── */}
        <div className="score-cards-grid">

          {/* Card 1 — Answer Quality */}
          <div className="score-card glass animate-fadeInUp">
            <div className="sc-header">
              <div>
                <div className="sc-label">Answer Quality</div>
                <div className="sc-score" style={{ color: '#6366f1' }}>
                  {Math.round(answer.answer_score || 0)}<span>/40</span>
                </div>
              </div>
              <div className="sc-icon">📋</div>
            </div>
            <ProgressBar value={answer.answer_score || 0} max={40} color="var(--accent-gradient)" />

            {rubricScores.length > 0 && (
              <div className="rubric-list">
                {rubricScores.map((r, i) => (
                  <div key={i} className={`rubric-item ${r.score > 0 ? 'pass' : 'fail'}`}>
                    <span className="rubric-icon">{r.score > 0 ? '✓' : '✗'}</span>
                    <div className="rubric-content">
                      <div className="rubric-point">{r.point}</div>
                      <div className="rubric-pts">{r.score}/{r.max} pts</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {groq.overall_feedback && (
              <div className="sc-feedback">
                <div className="sc-feedback-label">💬 Feedback</div>
                <p>{groq.overall_feedback}</p>
              </div>
            )}
          </div>

          {/* Card 2 — Confidence */}
          <div className="score-card glass animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
            <div className="sc-header">
              <div>
                <div className="sc-label">Confidence</div>
                <div className="sc-score" style={{ color: '#f59e0b' }}>
                  {Math.round(answer.confidence_score || 0)}<span>/30</span>
                </div>
              </div>
              <div className="sc-icon">🎤</div>
            </div>
            <ProgressBar value={answer.confidence_score || 0} max={30}
              color="linear-gradient(90deg, #f59e0b, #fbbf24)" />

            <div className="conf-metrics">
              {/* Filler words */}
              <div className="conf-metric">
                <div className="cm-label">Filler words</div>
                <div className={`cm-value ${answer.filler_word_count > 5 ? 'bad' : 'good'}`}>
                  {answer.filler_word_count} total
                </div>
                <div className="cm-sub">
                  {answer.filler_word_count === 0
                    ? '✓ Excellent! No filler words detected.'
                    : answer.filler_word_count <= 5
                    ? `✓ Good — aim for under 5. You used: ${Object.entries(fillerBreakdown).map(([k,v]) => `"${k}" ×${v}`).join(', ')}.`
                    : `⚠️ High count — aim for under 5. You said: ${Object.entries(fillerBreakdown).map(([k,v]) => `"${k}" ×${v}`).join(', ')}.`
                  }
                </div>
              </div>

              {/* WPM */}
              <div className="conf-metric">
                <div className="cm-label">Speaking pace</div>
                <WpmGauge wpm={answer.speaking_pace || 0} />
              </div>

              {/* Pauses */}
              <div className="conf-metric">
                <div className="cm-label">Long pauses (&gt;3 sec)</div>
                <div className={`cm-value ${answer.pause_count > 2 ? 'bad' : 'good'}`}>
                  {answer.pause_count} pauses
                </div>
                <div className="cm-sub">
                  {answer.pause_count === 0
                    ? '✓ Great flow — no long silences.'
                    : answer.pause_count <= 2
                    ? '✓ Short pauses are fine — they show composure.'
                    : '⚠️ Silences over 3s can hurt your score. Practise bridging with filler-free transitions.'}
                </div>
              </div>
            </div>
          </div>

          {/* Card 3 — Eye Contact */}
          <div className="score-card glass animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            <div className="sc-header">
              <div>
                <div className="sc-label">Eye Contact</div>
                <div className="sc-score" style={{ color: '#10b981' }}>
                  {Math.round(answer.eye_contact_score || 0)}<span>/30</span>
                </div>
              </div>
              <div className="sc-icon">👀</div>
            </div>
            <ProgressBar value={answer.eye_contact_score || 0} max={30}
              color="linear-gradient(90deg, #10b981, #34d399)" />

            <div className="gaze-pct-display">
              <span className={answer.gaze_percentage >= 80 ? 'score-green' : answer.gaze_percentage >= 60 ? 'score-amber' : 'score-red'}>
                {answer.gaze_percentage}%
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                time looking at camera &nbsp;·&nbsp; aim for &gt;80%
              </span>
            </div>

            <GazeTimeline gazePercent={answer.gaze_percentage} />

            <div className="sc-feedback">
              <div className="sc-feedback-label">💡 Tip</div>
              <p>
                {answer.gaze_percentage >= 80
                  ? 'Excellent eye contact — you maintained strong camera presence throughout.'
                  : 'Place a small coloured sticker dot just above your camera lens as a visual reminder to look there while speaking.'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Full Transcript ─────────────────────────────────────────────────── */}
        <div className="transcript-section glass animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
          <div className="ts-header">
            <h2>📝 Your Transcript</h2>
            {answer.transcript ? (
              <span className="ts-note">
                <span style={{ color: 'var(--warning)' }}>■</span> Filler words 
                <span style={{ marginLeft: 12, color: 'var(--success)' }}>■</span> Quality words
              </span>
            ) : (
              <span className="ts-note" style={{ color: 'var(--danger)' }}>No speech detected</span>
            )}
          </div>
          <div className="transcript-text">
            {answer.transcript ? (
              <div
                dangerouslySetInnerHTML={{
                  __html: highlightTranscript(answer.transcript, fillerBreakdown)
                }}
              />
            ) : (
              <div className="transcript-empty">
                <p>We couldn't hear any speech in this recording. Please ensure your microphone is working and you have granted permission.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Actions ─────────────────────────────────────────────────────────── */}
        <div className="report-actions animate-fadeInUp">
          <div className="report-nav-group">
            <button 
              className="btn btn-secondary" 
              disabled={sessionSiblings.findIndex(s => s.id === answer.id) === 0}
              onClick={() => {
                const idx = sessionSiblings.findIndex(s => s.id === answer.id);
                navigate(`/report/${sessionSiblings[idx - 1].id}`);
              }}
            >
              ← Previous Question
            </button>
            <div className="report-nav-status">
              Question {sessionSiblings.findIndex(s => s.id === answer.id) + 1} of {Math.max(totalQuestions, sessionSiblings.length)}
            </div>

            {/* If we're on the last answered question, but the session isn't over, show 'Continue' */}
            {sessionSiblings.findIndex(s => s.id === answer.id) === sessionSiblings.length - 1 && sessionSiblings.length < totalQuestions ? (
              <button className="btn btn-primary" onClick={handleNextQuestion}>
                Continue to Next Question →
              </button>
            ) : (
              <button 
                className="btn btn-primary"
                disabled={sessionSiblings.findIndex(s => s.id === answer.id) === sessionSiblings.length - 1}
                onClick={() => {
                  const idx = sessionSiblings.findIndex(s => s.id === answer.id);
                  navigate(`/report/${sessionSiblings[idx + 1].id}`);
                }}
              >
                Next Question Report →
              </button>
            )}
          </div>
          
          <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>
            Exit to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
