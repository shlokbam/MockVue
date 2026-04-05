import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Check, Info, ChevronRight, Search, X } from 'lucide-react';
import './Setup.css';

export default function Setup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function fetchMetadata() {
      try {
        const { data } = await api.get('/questions/metadata');
        setCompanies(data);
      } catch (err) {
        console.error("Failed to fetch company metadata", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMetadata();
  }, []);

  useEffect(() => {
    if (user && !user.has_api_key) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.monogram.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBegin = async () => {
    if (!selectedCompany || !selectedRole) return;
    setActionLoading(true);
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
      setActionLoading(false);
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

        {/* Company Selection Section */}
        <div className="setup-section animate-fadeInUp">
          <div className="setup-section-header">
            <div className="setup-section-label">Target Company</div>
            <div className="search-box glass">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="search-clear" onClick={() => setSearchTerm('')}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {loading ? (
             <div className="loading-state glass">
                <span className="spinner" />
                <p>Loading available interviews...</p>
             </div>
          ) : filteredCompanies.length > 0 ? (
            <div className="company-grid">
              {filteredCompanies.map((c, i) => (
                <button
                  key={c.id}
                  id={`company-${c.id.replace(/\s+/g, '-').toLowerCase()}`}
                  className={`company-card glass ${selectedCompany?.id === c.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedCompany(c);
                    setSelectedRole(c.roles.length === 1 ? c.roles[0] : '');
                  }}
                  style={{ '--c-color': c.color, animationDelay: `${i * 0.04}s` }}
                >
                  <div className="company-monogram" style={{ background: `${c.color}18`, border: `1px solid ${c.color}35`, color: c.color }}>
                    {c.logo && (
                      <img
                        src={c.logo}
                        alt={c.name}
                        className="company-logo-img"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'block';
                        }}
                      />
                    )}
                    <span style={{ display: c.logo ? 'none' : 'block' }}>{c.monogram}</span>
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
          ) : (
            <div className="search-empty glass">
              <p>No companies matching "<strong>{searchTerm}</strong>"</p>
              <button className="btn btn-ghost btn-sm" onClick={() => setSearchTerm('')}>Clear search</button>
            </div>
          )}
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
              disabled={actionLoading}
            >
              {actionLoading ? <span className="spinner" /> : <>Begin Interview <ChevronRight size={16} /></>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
