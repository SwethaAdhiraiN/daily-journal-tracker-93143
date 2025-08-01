import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { useOffline } from '../../contexts/OfflineContext';
import { entriesAPI } from '../../services/api';

// Mood configurations
const MOODS = {
  very_happy: { emoji: '😄', label: 'Very Happy', color: 'var(--mood-very-happy)' },
  happy: { emoji: '😊', label: 'Happy', color: 'var(--mood-happy)' },
  neutral: { emoji: '😐', label: 'Neutral', color: 'var(--mood-neutral)' },
  sad: { emoji: '😢', label: 'Sad', color: 'var(--mood-sad)' },
  very_sad: { emoji: '😭', label: 'Very Sad', color: 'var(--mood-very-sad)' },
  anxious: { emoji: '😰', label: 'Anxious', color: 'var(--mood-anxious)' },
  excited: { emoji: '🤩', label: 'Excited', color: 'var(--mood-excited)' },
  calm: { emoji: '😌', label: 'Calm', color: 'var(--mood-calm)' },
  angry: { emoji: '😠', label: 'Angry', color: 'var(--mood-angry)' },
  grateful: { emoji: '🙏', label: 'Grateful', color: 'var(--mood-grateful)' }
};

// PUBLIC_INTERFACE
const Dashboard = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [moodStats, setMoodStats] = useState({});
  
  const { user } = useAuth();
  const { isOnline, cachedEntries, cacheEntries } = useOffline();
  const navigate = useNavigate();

  useEffect(() => {
    loadEntries();
  }, [isOnline, cachedEntries]);

  // PUBLIC_INTERFACE
  const loadEntries = async () => {
    try {
      setLoading(true);
      setError('');

      if (isOnline) {
        // Fetch from API when online
        const data = await entriesAPI.getEntries(10, 0);
        setEntries(data.entries || []);
        cacheEntries(data.entries || []);
        calculateMoodStats(data.entries || []);
      } else {
        // Use cached entries when offline
        const recentEntries = cachedEntries
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 10);
        setEntries(recentEntries);
        calculateMoodStats(cachedEntries);
      }
    } catch (err) {
      console.error('Failed to load entries:', err);
      setError('Failed to load entries. Please try again.');
      
      // Fall back to cached entries on error
      if (cachedEntries.length > 0) {
        const recentEntries = cachedEntries
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 10);
        setEntries(recentEntries);
        calculateMoodStats(cachedEntries);
      }
    } finally {
      setLoading(false);
    }
  };

  // PUBLIC_INTERFACE
  const calculateMoodStats = (entriesData) => {
    const stats = {};
    entriesData.forEach(entry => {
      if (entry.mood) {
        stats[entry.mood] = (stats[entry.mood] || 0) + 1;
      }
    });
    setMoodStats(stats);
  };

  // PUBLIC_INTERFACE
  const handleEntryClick = (entryId) => {
    navigate(`/entry/${entryId}`);
  };

  // PUBLIC_INTERFACE
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  // PUBLIC_INTERFACE
  const truncateContent = (content, maxLength = 150) => {
    if (!content) return '';
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-spinner">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container dashboard">
      <div className="page-header">
        <h1 className="page-title">Welcome back, {user?.full_name || user?.username}!</h1>
        <p className="page-subtitle">
          {isOnline ? 'Your journal is up to date' : 'You\'re offline - showing cached entries'}
        </p>
      </div>

      {error && (
        <div className="error-message" style={{ 
          background: 'var(--error-color)', 
          color: 'white', 
          padding: '12px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      <div className="dashboard-grid">
        <div className="recent-entries-section">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Recent Entries</h2>
              <Link to="/new-entry" className="btn btn-primary btn-small">
                + New Entry
              </Link>
            </div>

            {entries.length === 0 ? (
              <div className="empty-state" style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                <h3>No entries yet</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Start your journaling journey by writing your first entry!
                </p>
                <Link to="/new-entry" className="btn btn-primary">
                  Write First Entry
                </Link>
              </div>
            ) : (
              <div className="recent-entries">
                {entries.map((entry) => (
                  <div 
                    key={entry.id} 
                    className="entry-card"
                    onClick={() => handleEntryClick(entry.id)}
                  >
                    <div className="entry-header">
                      <div>
                        <h3 className="entry-title">{entry.title}</h3>
                        <div className="entry-date">{formatDate(entry.created_at)}</div>
                      </div>
                      {entry.mood && (
                        <div className="entry-mood" title={MOODS[entry.mood]?.label}>
                          {MOODS[entry.mood]?.emoji}
                        </div>
                      )}
                      {entry.isOffline && (
                        <div className="offline-indicator" title="Saved offline">
                          🔄
                        </div>
                      )}
                    </div>
                    
                    <div className="entry-preview">
                      {truncateContent(entry.content)}
                    </div>

                    {entry.tags && entry.tags.length > 0 && (
                      <div className="entry-tags">
                        {entry.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="tag">
                            {tag}
                          </span>
                        ))}
                        {entry.tags.length > 3 && (
                          <span className="tag">+{entry.tags.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="sidebar">
          <div className="mood-tracker card">
            <div className="card-header">
              <h3 className="card-title">Mood Overview</h3>
            </div>
            
            {Object.keys(moodStats).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>😊</div>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Start tracking your moods by adding them to your entries!
                </p>
              </div>
            ) : (
              <div className="mood-stats">
                {Object.entries(moodStats)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([mood, count]) => (
                    <div key={mood} className="mood-stat-item">
                      <div className="mood-info">
                        <span className="mood-emoji">{MOODS[mood]?.emoji}</span>
                        <span className="mood-name">{MOODS[mood]?.label}</span>
                      </div>
                      <div className="mood-count">
                        <span className="count">{count}</span>
                        <div 
                          className="mood-bar"
                          style={{
                            width: `${(count / Math.max(...Object.values(moodStats))) * 100}%`,
                            backgroundColor: MOODS[mood]?.color || 'var(--primary-color)'
                          }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="quick-actions card">
            <div className="card-header">
              <h3 className="card-title">Quick Actions</h3>
            </div>
            
            <div className="action-buttons">
              <Link to="/calendar" className="btn btn-secondary btn-full">
                📅 View Calendar
              </Link>
              <Link to="/search" className="btn btn-secondary btn-full">
                🔍 Search Entries
              </Link>
              <Link to="/export" className="btn btn-secondary btn-full">
                📥 Export Data
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <Link to="/new-entry" className="fab" title="Write new entry">
        +
      </Link>
    </div>
  );
};

export default Dashboard;
