import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Target, Plus, TrendingUp, Trash2 } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import './Dashboard.css';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    const d = payload[0].payload;
    return (
      <div className="chart-tooltip glass">
        <div className="ct-date">{d.date}</div>
        <div className="ct-company">{d.company}</div>
        <div className="ct-score">{d.score}<span>/100</span></div>
      </div>
    );
  }
  return null;
};

function ScoreColor(score) {
  if (score >= 75) return 'var(--success)';
  if (score >= 50) return 'var(--warning)';
  return 'var(--danger)';
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isDelModalOpen, setIsDelModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [sessRes, dashRes] = await Promise.all([
          api.get('/sessions'),
          api.get('/dashboard'),
        ]);
        setSessions(sessRes.data);
        setDashData(dashRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleViewSession = (sessionId) => {
    navigate(`/session/${sessionId}`);
  };

  const handleDeleteSession = (e, sessionId) => {
    e.stopPropagation();
    setSessionToDelete(sessionId);
    setIsDelModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!sessionToDelete) return;
    try {
      await api.delete(`/sessions/${sessionToDelete}`);
      setSessions(prev => prev.filter(s => s.id !== sessionToDelete));
    } catch (err) {
      console.error("Failed to delete session:", err);
    } finally {
      setIsDelModalOpen(false);
      setSessionToDelete(null);
    }
  };

  const completedSessions = sessions.filter((s) => s.status === 'complete');

  return (
    <div className="page">
      <div className="mesh-bg" />
      <Navbar />

      <div className="dashboard-wrap">
        {/* Header */}
        <div className="dashboard-header animate-fadeInUp">
          <div>
            <h1>Dashboard</h1>
            <p>Welcome back, {user?.name?.split(' ')?.[0] ?? 'there'}. Ready to improve your score?</p>
          </div>
          <button
            id="start-new-session"
            className="btn btn-primary btn-lg"
            onClick={() => navigate('/setup')}
          >
            <Plus size={16} />
            New session
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner" style={{ width: 28, height: 28 }} />
          </div>
        ) : (
          <>
            {/* Stats bar */}
            {dashData && (
              <div className="stats-row animate-fadeInUp">
                <div className="stat-card glass">
                  <div className="stat-icon"><TrendingUp size={16} /></div>
                  <div className="stat-value">{dashData.total_sessions}</div>
                  <div className="stat-label">Sessions completed</div>
                </div>
                <div className="stat-card glass">
                  <div className="stat-icon"><TrendingUp size={16} /></div>
                  <div className="stat-value" style={{ color: ScoreColor(dashData.average_score) }}>
                    {dashData.average_score || '—'}
                  </div>
                  <div className="stat-label">Average score</div>
                </div>
                <div className="stat-card glass">
                  <div className="stat-icon"><TrendingUp size={16} /></div>
                  <div className="stat-value">
                    {completedSessions.length > 0
                      ? Math.max(...completedSessions.map((s) => s.overall_score))
                      : '—'}
                  </div>
                  <div className="stat-label">Personal best</div>
                </div>
              </div>
            )}

            {/* Score trend chart */}
            {dashData?.score_trend?.length > 0 && (
              <div className="chart-section glass animate-fadeInUp">
                <div className="chart-header">
                  <div>
                    <h2>Score Trend</h2>
                    <p>Your progress across all sessions</p>
                  </div>
                </div>
                <div className="chart-wrap">
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={dashData.score_trend} margin={{ top: 20, right: 10, left: -15, bottom: 0 }}>
                      <defs>
                        <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                      <XAxis 
                        dataKey="id" 
                        stroke="var(--text-muted)" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fontFamily: 'Inter' }}
                        tickFormatter={(id) => dashData.score_trend.find(p => p.id === id)?.date || ''}
                        dy={10}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        stroke="var(--text-muted)" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fontFamily: 'Inter' }} 
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="var(--accent)"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#scoreGradient)"
                        dot={{ fill: 'var(--accent)', r: 4, strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: '#fff', strokeWidth: 2, stroke: 'var(--accent)' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Past sessions */}
            <div className="sessions-section animate-fadeInUp">
              <h2>Past Sessions</h2>
              {completedSessions.length === 0 ? (
                <div className="empty-state glass">
                  <div className="empty-icon-wrap">
                    <Target size={28} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <h3>No sessions yet</h3>
                  <p>Complete your first practice session and your history will appear here.</p>
                  <button className="btn btn-primary" onClick={() => navigate('/setup')}>
                    Start practising
                  </button>
                </div>
              ) : (
                <div className="session-list">
                  {completedSessions.map((s, i) => (
                    <div className="session-card glass" key={s.id} style={{ animationDelay: `${i * 0.04}s` }}>
                      <div className="session-card-left">
                        <div className="session-company">{s.company}</div>
                        <div className="session-meta">
                          <span className="chip">{s.role}</span>
                          <span className="session-date">
                            {new Date(s.date.endsWith('Z') ? s.date : s.date + 'Z').toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="session-card-right">
                        <div
                          className="session-score"
                          style={{ color: ScoreColor(s.overall_score) }}
                        >
                          {s.overall_score}<span>/100</span>
                        </div>
                        <div className="session-actions">
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleViewSession(s.id)}
                          >
                            View report
                          </button>
                          <button
                            className="btn-delete-icon"
                            onClick={(e) => handleDeleteSession(e, s.id)}
                            title="Delete session"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={isDelModalOpen}
        title="Delete Session Report"
        message="Are you sure you want to delete this practice session? This action cannot be undone."
        confirmText="Delete Report"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => {
          setIsDelModalOpen(false);
          setSessionToDelete(null);
        }}
      />
    </div>
  );
}
