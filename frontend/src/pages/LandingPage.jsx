import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, ChevronRight } from 'lucide-react';
import './LandingPage.css';

const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
      </svg>
    ),
    title: 'Company-Specific Questions',
    desc: 'Tailored question banks for JPMorgan, Goldman Sachs, TCS, Infosys, and more.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.9L15 14v-4z"/><rect x="2" y="6" width="13" height="12" rx="2"/>
      </svg>
    ),
    title: 'Expert Interview Conditions',
    desc: '30 seconds to read, 2 minutes to respond — exactly like the real assessment.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    ),
    title: 'AI-Powered Feedback',
    desc: 'Instant scores on content quality, speaking pace, and eye contact.',
  },
];

export default function LandingPage() {
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing">
      <div className="mesh-bg" />

      {/* Navbar */}
      <nav className="landing-nav">
        <span className="landing-brand">Mock<span>Vue</span></span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn btn-ghost btn-sm ${mode === 'login' ? 'landing-tab-active' : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Sign in
          </button>
          <button
            className={`btn btn-secondary btn-sm ${mode === 'register' ? 'landing-tab-active' : ''}`}
            onClick={() => { setMode('register'); setError(''); }}
          >
            Create account
          </button>
        </div>
      </nav>

      <div className="landing-content">
        {/* Hero */}
        <div className="hero animate-fadeInUp">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            Free — No credit card required
          </div>
          <h1 className="hero-title">
            Master your AI Interview<br />
            <span className="gradient-text">before the real thing.</span>
          </h1>
          <p className="hero-subtitle">
            Companies like JPMorgan, Goldman Sachs, and TCS use AI-powered video 
            assessments for first-round interviews. MockVue helps you master them.
          </p>

          <div className="features-row">
            {FEATURES.map((f, i) => (
              <div className="feature-card glass" key={i} style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="feature-icon">{f.icon}</div>
                <div>
                  <div className="feature-title">{f.title}</div>
                  <div className="feature-desc">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Auth Card */}
        <div className="auth-card glass animate-fadeInUp" style={{ animationDelay: '0.15s' }}>
          <div className="auth-card-header">
            <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
            <p>{mode === 'login' ? 'Sign in to continue practising.' : 'Start your interview prep today.'}</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Full name</label>
                <input
                  id="reg-name"
                  className="form-input"
                  type="text"
                  placeholder="Ayaan Khan"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                id="auth-email"
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                id="auth-password"
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="auth-error">
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <button
              id="auth-submit"
              className="btn btn-primary btn-lg"
              type="submit"
              disabled={loading}
              style={{ width: '100%', marginTop: '4px' }}
            >
              {loading ? (
                <span className="spinner" />
              ) : mode === 'login' ? (
                <>Sign in <ChevronRight size={16} /></>
              ) : (
                <>Start practising <ChevronRight size={16} /></>
              )}
            </button>
          </form>

          <div className="auth-switch">
            {mode === 'login' ? (
              <>Don't have an account?{' '}
                <button className="link-btn" onClick={() => { setMode('register'); setError(''); }}>
                  Sign up free
                </button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button className="link-btn" onClick={() => { setMode('login'); setError(''); }}>
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <footer className="landing-footer">
        MockVue &copy; 2025 &middot; Interview prep for campus placements
      </footer>
    </div>
  );
}
