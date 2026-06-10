import React from 'react';
import { Icon } from './Icon';

const GOOGLE_ICON_URL = 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg';

export default function LoginModal({ open, onClose, onSignIn, loading, error, firebaseReady }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="icon-btn modal-close" onClick={onClose} aria-label="Close">
          <Icon name="close" />
        </button>
        <div className="modal-icon">
          <Icon name="volume" size={32} />
        </div>
        <h2 className="modal-title">Sign in</h2>
        <p className="modal-subtitle">to continue to Voice AI</p>
        {error && <div className="modal-error">{error}</div>}
        <button
          className="google-signin-btn"
          onClick={onSignIn}
          disabled={loading || !firebaseReady}
        >
          {loading ? (
            <span className="spinner" />
          ) : (
            <>
              <img src={GOOGLE_ICON_URL} width="20" height="20" alt="Google" />
              <span>Continue with Google</span>
            </>
          )}
        </button>
        <p className="modal-legal">
          To continue, Google will share your name, email, and profile picture with Voice AI.
        </p>
      </div>
    </div>
  );
}
