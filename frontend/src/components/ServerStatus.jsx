import { Loader2, Cloud, Sparkles } from 'lucide-react';
import './ServerStatus.css';

export default function ServerStatus({ wakingUp }) {
  if (!wakingUp) return null;

  return (
    <div className="server-status-overlay animate-fadeIn">
      <div className="server-status-card glass animate-scaleIn">
        <div className="server-status-icon-wrap">
          <Cloud className="cloud-icon" size={32} />
          <Loader2 className="spinner-icon" size={48} />
          <Sparkles className="sparkle-icon" size={20} />
        </div>
        
        <div className="server-status-text">
          <h3>Waking up the Cloud Server...</h3>
          <p>We're on the free tier, so the first connection takes <strong>~40 seconds</strong>. Please stay with us, we're optimizing your experience!</p>
        </div>

        <div className="progress-bar-wrap">
           <div className="progress-bar-fill" />
        </div>
        
        <div className="server-status-footer">
          <span>☕ Almost ready...</span>
        </div>
      </div>
    </div>
  );
}
