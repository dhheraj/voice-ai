import React from 'react';
import { Icon } from './Icon';

export default function Header({ theme, onToggleTheme, onToggleSidebar, user, onLoginClick, onLogoutClick }) {
  return (
    <header className="app-bar">
      <button className="icon-btn" onClick={onToggleSidebar} aria-label="Menu">
        <Icon name="menu" />
      </button>
      <div className="app-bar-title">
        <div className="app-bar-logo">
          <Icon name="volume" size={22} />
        </div>
        <span>Voice AI</span>
      </div>
      <div className="app-bar-actions">
        <button className="icon-btn" onClick={onToggleTheme} aria-label="Toggle theme" title={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}>
          <Icon name={theme === 'light' ? 'moon' : 'sun'} />
        </button>
        {user ? (
          <button className="user-avatar-btn" onClick={onLogoutClick} title={`${user.displayName || user.email} - Sign out`}>
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} />
            ) : (
              <span>{(user.displayName || user.email || 'U').charAt(0).toUpperCase()}</span>
            )}
          </button>
        ) : (
          <button className="signin-btn" onClick={onLoginClick}>
            <Icon name="user" size={18} />
            <span>Sign in</span>
          </button>
        )}
      </div>
    </header>
  );
}
