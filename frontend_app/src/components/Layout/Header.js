import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useOffline } from '../../contexts/OfflineContext';

// PUBLIC_INTERFACE
const Header = ({ theme, toggleTheme }) => {
  const { user, logout } = useAuth();
  const { isOnline } = useOffline();
  const location = useLocation();
  const navigate = useNavigate();

  // PUBLIC_INTERFACE
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <header className="header">
      <Link to="/" className="header-logo">
        📝 Daily Journal
      </Link>

      <nav className="header-nav">
        {user ? (
          <>
            <Link to="/dashboard" className={isActive('/dashboard')}>
              Dashboard
            </Link>
            <Link to="/new-entry" className={isActive('/new-entry')}>
              New Entry
            </Link>
            <Link to="/calendar" className={isActive('/calendar')}>
              Calendar
            </Link>
            <Link to="/search" className={isActive('/search')}>
              Search
            </Link>
            <Link to="/export" className={isActive('/export')}>
              Export
            </Link>
            <div className="user-menu">
              <span className="user-name">
                {user.full_name || user.username}
              </span>
              <button onClick={handleLogout} className="btn btn-small btn-secondary">
                Logout
              </button>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className={isActive('/login')}>
              Login
            </Link>
            <Link to="/register" className={isActive('/register')}>
              Register
            </Link>
          </>
        )}
        
        <div className="header-status">
          <span className={`connection-status ${isOnline ? 'online' : 'offline'}`}>
            {isOnline ? '🟢' : '🔴'} {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        <button 
          className="theme-toggle" 
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </nav>
    </header>
  );
};

export default Header;
