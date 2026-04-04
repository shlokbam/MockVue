import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { Check, Info, ChevronRight } from 'lucide-react';
import './Setup.css';

const COMPANIES = [
  { id: 'JPMorgan', name: 'JPMorgan Chase', monogram: 'JP', color: '#3b82f6', roles: ['Software Engineer', 'Business Analyst'] },
  { id: 'Goldman Sachs', name: 'Goldman Sachs', monogram: 'GS', color: '#10b981', roles: ['Software Engineer'] },
  { id: 'TCS', name: 'Tata Consultancy', monogram: 'TC', color: '#8b5cf6', roles: ['Software Engineer'] },
  { id: 'Infosys', name: 'Infosys', monogram: 'IN', color: '#f59e0b', roles: ['Software Engineer'] },
  { id: 'General HR', name: 'General HR', monogram: 'HR', color: '#6366f1', roles: ['General'] },
];

export default function Setup() {
  const navigate = useNavigate();
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBegin = async () => {
    if (!selectedCompany || !selectedRole) return;
    setLoading(true);
    try {
      const { data: session } = await api.post('/sessions', {
        company: selectedCompany.id,
        role: selectedRole,
      });
      const { data: questions } = await api.get('/questions', {
        params: { company: selectedCompany.id, role: selectedRole },
      });

      sessionStorage.setItem('mv_session', JSON.stringify(session));
      sessionStorage.setItem('mv_questions', JSON.stringify(questions));
      sessionStorage.setItem('mv_q_index', '0');
      sessionStorage.setItem('mv_answers', JSON.stringify([]));

      navigate('/check');
    } catch (e) {
      console.error(e);
      alert('Could not load questions. Check backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="mesh-bg" />
      <Navbar />

      <div className="setup-wrap">
        <div className="setup-header animate-fadeInUp">
          <h1>Configure your interview</h1>
          <p>Select the company and role you are preparing for</p>
        </div>

        {/* Company Grid */}
        <div className="setup-section animate-fadeInUp">
          <div className="setup-section-label">Company</div>
          <div className="company-grid">
            {COMPANIES.map((c, i) => (
              <button
                key={c.id}
                id={`company-${c.id.replace(/\s+/g, '-').toLowerCase()}`}
                className={`company-card glass ${selectedCompany?.id === c.id ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedCompany(c);
                  setSelectedRole(c.roles.length === 1 ? c.roles[0] : '');
                }}
                style={{ '--c-color': c.color, animationDelay: `${i * 0.06}s` }}
              >
                <div className="company-monogram" style={{ background: `${c.color}18`, border: `1px solid ${c.color}35`, color: c.color }}>
                  {c.monogram}
                </div>
                <div className="company-name">{c.name}</div>
                <div className="company-meta">5 questions</div>
                {selectedCompany?.id === c.id && (
                  <div className="company-check-icon">
                    <Check size={12} strokeWidth={2.5} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Role Selector */}
        {selectedCompany && (
          <div className="setup-section animate-fadeInUp">
            <div className="setup-section-label">Role at {selectedCompany.name}</div>
            <div className="role-options">
              {selectedCompany.roles.map((r) => (
                <button
                  key={r}
                  id={`role-${r.replace(/\s+/g, '-').toLowerCase()}`}
                  className={`role-chip ${selectedRole === r ? 'active' : ''}`}
                  onClick={() => setSelectedRole(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Begin Button */}
        {selectedCompany && selectedRole && (
          <div className="begin-wrap animate-fadeInUp">
            <div className="begin-info glass">
              <Info size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <span>
                You'll answer <strong>5 questions</strong> for{' '}
                <strong>{selectedCompany.name} &middot; {selectedRole}</strong>
              </span>
            </div>
            <button
              id="begin-interview"
              className="btn btn-primary btn-lg"
              onClick={handleBegin}
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : <>Begin Interview <ChevronRight size={16} /></>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
