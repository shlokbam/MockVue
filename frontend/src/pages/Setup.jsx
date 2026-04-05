import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Check, Info, ChevronRight, Search, X } from 'lucide-react';
import './Setup.css';

const COMPANIES = [
  { id: 'Google', name: 'Google', monogram: 'GO', color: '#4285F4', logo: 'https://logo.clearbit.com/google.com', roles: ['Software Engineer', 'Data Scientist', 'Product Manager'] },
  { id: 'Amazon', name: 'Amazon', monogram: 'AM', color: '#FF9900', logo: 'https://logo.clearbit.com/amazon.com', roles: ['Software Engineer', 'SDE-II', 'QA Engineer'] },
  { id: 'Microsoft', name: 'Microsoft', monogram: 'MS', color: '#00A4EF', logo: 'https://logo.clearbit.com/microsoft.com', roles: ['Software Engineer', 'Program Manager'] },
  { id: 'Meta', name: 'Meta', monogram: 'ME', color: '#0668E1', logo: 'https://logo.clearbit.com/meta.com', roles: ['Software Engineer', 'Data Engineer'] },
  { id: 'Apple', name: 'Apple', monogram: 'AP', color: '#A2AAAD', logo: 'https://logo.clearbit.com/apple.com', roles: ['Software Engineer', 'Hardware Engineer'] },
  { id: 'Netflix', name: 'Netflix', monogram: 'NX', color: '#E50914', logo: 'https://logo.clearbit.com/netflix.com', roles: ['Software Engineer', 'UI Engineer'] },
  { id: 'JPMorgan', name: 'JPMorgan Chase', monogram: 'JP', color: '#3b82f6', logo: 'https://logo.clearbit.com/jpmorganchase.com', roles: ['Software Engineer', 'Business Analyst'] },
  { id: 'Goldman Sachs', name: 'Goldman Sachs', monogram: 'GS', color: '#10b981', logo: 'https://logo.clearbit.com/goldmansachs.com', roles: ['Software Engineer'] },
  { id: 'Salesforce', name: 'Salesforce', monogram: 'SF', color: '#00A1E0', logo: 'https://logo.clearbit.com/salesforce.com', roles: ['Software Engineer', 'Sales Engineer'] },
  { id: 'Adobe', name: 'Adobe', monogram: 'AD', color: '#FF0000', logo: 'https://logo.clearbit.com/adobe.com', roles: ['Software Engineer', 'Experience Designer'] },
  { id: 'Uber', name: 'Uber', monogram: 'UB', color: '#333333', logo: 'https://logo.clearbit.com/uber.com', roles: ['Software Engineer', 'Backend Engineer'] },
  { id: 'Airbnb', name: 'Airbnb', monogram: 'AB', color: '#FF5A5F', logo: 'https://logo.clearbit.com/airbnb.com', roles: ['Software Engineer', 'Data Analyst'] },
  { id: 'TCS', name: 'Tata Consultancy', monogram: 'TC', color: '#8b5cf6', logo: 'https://logo.clearbit.com/tcs.com', roles: ['Software Engineer'] },
  { id: 'Infosys', name: 'Infosys', monogram: 'IN', color: '#f59e0b', logo: 'https://logo.clearbit.com/infosys.com', roles: ['Software Engineer'] },
  { id: 'General HR', name: 'General HR', monogram: 'HR', color: '#6366f1', logo: null, roles: ['General'] },
];

export default function Setup() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !user.has_api_key) {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredCompanies = COMPANIES.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.monogram.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

          {filteredCompanies.length > 0 ? (
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
