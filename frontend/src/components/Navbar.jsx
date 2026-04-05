import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar-brand">
        Mock<span>Vue</span>
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {user && (
          <>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              color: 'var(--text-muted)', fontSize: '13px'
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'var(--accent-glow)',
                border: '1px solid rgba(99,102,241,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 600, color: 'var(--accent-light)',
                letterSpacing: '0.02em', flexShrink: 0
              }}>
                {initials}
              </div>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                {user?.name?.split(' ')?.[0] ?? 'there'}
              </span>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/profile')}>
              Profile
            </button>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
              Sign out
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
