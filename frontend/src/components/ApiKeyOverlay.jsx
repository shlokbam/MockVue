import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Key, Check, AlertCircle, Info, ExternalLink } from 'lucide-react';
import './ApiKeyOverlay.css';

export default function ApiKeyOverlay() {
  const { user, verifyApiKey, saveApiKey } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // If user already has a key, don't show the overlay
  if (!user || user.has_api_key) return null;

  const handleTestAndSave = async (e) => {
    e.preventDefault();
    if (!apiKey) return;
    
    setLoading(true);
    setMsg({ type: 'info', text: 'Verifying your API key...' });
    
    try {
      // 1. Verify with Groq
      await verifyApiKey(apiKey);
      
      // 2. Save to profile
      await saveApiKey(apiKey);
      setMsg({ type: 'success', text: 'Success! Redirecting to your dashboard...' });
      
      // The user state update will cause this overlay to unmount automatically
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Invalid key. Please check and try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="api-overlay">
      <div className="api-modal glass animate-zoomIn">
        <div className="api-modal-icon">
          <Key size={32} />
        </div>
        
        <h2>One Last Step</h2>
        <p>MockVue uses your personal AI for evaluations. Please enter your <strong>Groq API Key</strong> to continue. It's free and takes 30 seconds.</p>

        <div className="api-info-box">
          <Info size={16} />
          <span>Don't have a key? <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer">Get one here <ExternalLink size={12} /></a></span>
        </div>

        <form onSubmit={handleTestAndSave}>
          <input 
            type="password" 
            className="form-input text-center"
            placeholder="gsk_xxxxxxxxxxxxxxxxxxxx"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            required
            autoFocus
          />
          
          {msg.text && (
            <div className={`form-msg ${msg.type} centered`}>
              {msg.type === 'success' ? <Check size={14} /> : msg.type === 'info' ? <div className="spinner-sm" /> : <AlertCircle size={14} />}
              <span>{msg.text}</span>
            </div>
          )}

          <button className="btn btn-primary btn-lg w-full" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Activate MockVue'}
          </button>
        </form>

        <p className="api-modal-footer">
          Your key is saved securely and used only for your assessments.
        </p>
      </div>
    </div>
  );
}
