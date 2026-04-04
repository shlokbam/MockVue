import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { Calendar, Briefcase, Building2, ChevronRight, Star, TrendingUp, Award } from 'lucide-react';
import './SessionDetail.css';

function ScoreCard({ score, label, color, icon: Icon }) {
  return (
    <div className="sd-stat-card glass">
      <div className="sd-stat-icon-wrap" style={{ background: `${color}15`, color: color }}>
        <Icon size={18} />
      </div>
      <div>
        <div className="sd-stat-value" style={{ color }}>{score}<span>/100</span></div>
        <div className="sd-stat-label">{label}</div>
      </div>
    </div>
  );
}

export default function SessionDetail() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [sessRes, ansRes] = await Promise.all([
          api.get(`/sessions/${sessionId}`),
          api.get(`/answers/session/${sessionId}`),
        ]);
        setSession(sessRes.data);
        // Sort answers by created_at or ID to ensure consistent 1-5 order
        setAnswers(ansRes.data.sort((a, b) => a.id - b.id));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="mesh-bg" />
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  if (!session) return null;

  const dateStr = new Date(session.date.endsWith('Z') ? session.date : session.date + 'Z').toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  const getScoreColor = (s) => (s >= 75 ? 'var(--success)' : s >= 50 ? 'var(--warning)' : 'var(--danger)');

  return (
    <div className="page">
      <div className="mesh-bg" />
      <Navbar />

      <div className="sd-wrap container">
        {/* Header / Hero */}
        <div className="sd-header animate-fadeInUp">
          <div className="sd-header-left">
            <div className="sd-breadcrumb" onClick={() => navigate('/dashboard')}>
              Dashboard / Practice History
            </div>
            <h1>{session.company} Practice Session</h1>
            <div className="sd-meta-row">
              <div className="sd-meta-item"><Building2 size={14} /> {session.company}</div>
              <div className="sd-meta-item"><Briefcase size={14} /> {session.role}</div>
              <div className="sd-meta-item"><Calendar size={14} /> {dateStr}</div>
            </div>
          </div>
          
          <div className="sd-header-right">
            <div className="sd-overall-ring glass">
               <div className="sd-ring-label">Aggregate Score</div>
               <div className="sd-ring-value" style={{ color: getScoreColor(session.overall_score) }}>
                 {session.overall_score}<span>/100</span>
               </div>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="sd-stats-grid animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
          <ScoreCard 
            score={session.overall_score} 
            label="Total Proficiency" 
            color="var(--accent-light)" 
            icon={Award} 
          />
          <ScoreCard 
             score={Math.round(answers.reduce((acc, a) => acc + (a.confidence_score || 0), 0) / answers.length)} 
             label="Avg. Confidence" 
             color="var(--warning)" 
             icon={TrendingUp} 
          />
          <ScoreCard 
             score={Math.round(answers.reduce((acc, a) => acc + (a.eye_contact_score || 0), 0) / answers.length)} 
             label="Avg. Eye Contact" 
             color="var(--success)" 
             icon={Star} 
          />
        </div>

        {/* Questions List */}
        <div className="sd-questions-section animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          <div className="sd-sec-header">
            <h2>Detailed Breakdown</h2>
            <p>Dive into specific feedback for each of the 5 questions</p>
          </div>

          <div className="sd-questions-grid">
            {answers.map((ans, idx) => {
              const total = (ans.answer_score || 0) + (ans.confidence_score || 0) + (ans.eye_contact_score || 0);
              return (
                <div 
                  key={ans.id} 
                  className="sd-question-card glass"
                  onClick={() => navigate(`/report/${ans.id}`)}
                >
                  <div className="sd-q-badge">Question {idx + 1}</div>
                  <div className="sd-q-main">
                    <p className="sd-q-text">{ans.question_text}</p>
                    <div className="sd-q-footer">
                       <div className="sd-q-score" style={{ color: getScoreColor(total) }}>
                         {Math.round(total)}<span>/100</span>
                       </div>
                       <div className="sd-q-link">
                         View Report <ChevronRight size={14} />
                       </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
