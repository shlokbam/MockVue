import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { User, Shield, Key, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import './Profile.css';

export default function Profile() {
  const { user, updateProfile, changePassword, verifyApiKey, saveApiKey } = useAuth();
  
  // Profile State
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  // Password State
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState({ type: '', text: '' });

  // API Key State
  const [apiKey, setApiKey] = useState('');
  const [revealKey, setRevealKey] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiMsg, setApiMsg] = useState({ type: '', text: '' });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg({ type: '', text: '' });
    try {
      await updateProfile(profileForm.name, profileForm.email);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to update profile.' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) {
      setPwMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setPwLoading(true);
    setPwMsg({ type: '', text: '' });
    try {
      await changePassword(pwForm.current, pwForm.next);
      setPwMsg({ type: 'success', text: 'Password changed successfully!' });
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      setPwMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to change password.' });
    } finally {
      setPwLoading(false);
    }
  };

  const handleSaveApiKey = async (e) => {
    e.preventDefault();
    if (!apiKey) return;
    setApiLoading(true);
    setApiMsg({ type: '', text: '' });
    try {
      // 1. Verify
      setApiMsg({ type: 'info', text: 'Testing API key...' });
      await verifyApiKey(apiKey);
      
      // 2. Save
      await saveApiKey(apiKey);
      setApiMsg({ type: 'success', text: 'API key verified and saved!' });
      setApiKey('');
    } catch (err) {
      setApiMsg({ type: 'error', text: err.response?.data?.detail || 'Invalid API key. Please check and try again.' });
    } finally {
      setApiLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="mesh-bg" />
      <Navbar />

      <div className="profile-container animate-fadeIn">
        <header className="profile-header">
          <h1>Account Settings</h1>
          <p>Manage your personal information, security, and AI configuration.</p>
        </header>

        <div className="profile-grid">
          {/* General Info */}
          <section className="profile-card glass">
            <div className="pc-header">
              <User size={20} className="pc-icon" />
              <h2>General Information</h2>
            </div>
            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={profileForm.name}
                  onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  className="form-input"
                  value={profileForm.email}
                  onChange={e => setProfileForm({...profileForm, email: e.target.value})}
                  required
                />
              </div>
              {profileMsg.text && (
                <div className={`form-msg ${profileMsg.type}`}>
                  {profileMsg.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                  {profileMsg.text}
                </div>
              )}
              <button type="submit" className="btn btn-primary" disabled={profileLoading}>
                {profileLoading ? <span className="spinner" /> : 'Save Changes'}
              </button>
            </form>
          </section>

          {/* AI Settings */}
          <section className="profile-card glass">
            <div className="pc-header">
              <Key size={20} className="pc-icon" />
              <h2>AI Configuration</h2>
            </div>
            <p className="pc-desc">
              MockVue requires a personal Groq API key for evaluations. 
              {user?.has_api_key ? 
                <span className="status-badge success">✓ Active</span> : 
                <span className="status-badge warning">! Missing</span>
              }
            </p>
            <form onSubmit={handleSaveApiKey}>
              <div className="form-group">
                <label>Groq API Key</label>
                <div className="input-with-action">
                  <input 
                    type={revealKey ? "text" : "password"}
                    className="form-input"
                    placeholder={user?.has_api_key ? "••••••••••••••••" : "Paste your gsk_... key here"}
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    required
                  />
                  <button 
                    type="button" 
                    className="icon-btn" 
                    onClick={() => setRevealKey(!revealKey)}
                  >
                    {revealKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {apiMsg.text && (
                <div className={`form-msg ${apiMsg.type}`}>
                  {apiMsg.type === 'success' ? <Check size={14} /> : apiMsg.type === 'info' ? <span className="spinner-sm" /> : <AlertCircle size={14} />}
                  {apiMsg.text}
                </div>
              )}
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={apiLoading}>
                  {apiLoading ? <span className="spinner" /> : 'Test & Save Key'}
                </button>
                <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="link-btn text-xs">
                  Get a free key →
                </a>
              </div>
            </form>
          </section>

          {/* Security */}
          <section className="profile-card glass">
            <div className="pc-header">
              <Shield size={20} className="pc-icon" />
              <h2>Password & Security</h2>
            </div>
            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label>Current Password</label>
                <input 
                  type="password" 
                  className="form-input"
                  value={pwForm.current}
                  onChange={e => setPwForm({...pwForm, current: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input 
                  type="password" 
                  className="form-input"
                  value={pwForm.next}
                  onChange={e => setPwForm({...pwForm, next: e.target.value})}
                  required
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input 
                  type="password" 
                  className="form-input"
                  value={pwForm.confirm}
                  onChange={e => setPwForm({...pwForm, confirm: e.target.value})}
                  required
                />
              </div>
              {pwMsg.text && (
                <div className={`form-msg ${pwMsg.type}`}>
                  {pwMsg.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                  {pwMsg.text}
                </div>
              )}
              <button type="submit" className="btn btn-secondary" disabled={pwLoading}>
                {pwLoading ? <span className="spinner" /> : 'Update Password'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
