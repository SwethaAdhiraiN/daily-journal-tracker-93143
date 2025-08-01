import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// PUBLIC_INTERFACE
const Home = () => {
  const { user } = useAuth();

  return (
    <div className="home">
      <div className="home-content fade-in">
        <h1 className="home-title">Daily Journal</h1>
        <p className="home-description">
          Your personal space to reflect, track your moods, and document your journey. 
          Start journaling today and discover insights about yourself.
        </p>
        
        {!user ? (
          <div className="home-actions">
            <Link to="/register" className="btn btn-primary btn-large">
              Get Started
            </Link>
            <Link to="/login" className="btn btn-secondary btn-large">
              Sign In
            </Link>
          </div>
        ) : (
          <div className="home-actions">
            <Link to="/dashboard" className="btn btn-primary btn-large">
              Go to Dashboard
            </Link>
            <Link to="/new-entry" className="btn btn-accent btn-large">
              Write New Entry
            </Link>
          </div>
        )}

        <div className="features-grid mt-4">
          <div className="feature-card">
            <div className="feature-icon">📝</div>
            <h3>Daily Journaling</h3>
            <p>Write and organize your thoughts with our intuitive editor</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">😊</div>
            <h3>Mood Tracking</h3>
            <p>Track your emotions and see patterns over time</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Smart Search</h3>
            <p>Find entries by date, mood, tags, or keywords</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📅</div>
            <h3>Calendar View</h3>
            <p>Visualize your journaling habit with calendar integration</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Mobile Friendly</h3>
            <p>Write entries anywhere with responsive design</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌙</div>
            <h3>Dark Mode</h3>
            <p>Choose between light and dark themes for comfort</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
