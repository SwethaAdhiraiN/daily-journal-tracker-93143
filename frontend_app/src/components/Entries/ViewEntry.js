import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { useOffline } from '../../contexts/OfflineContext';
import { entriesAPI } from '../../services/api';

// Mood configurations
const MOODS = {
  very_happy: { emoji: '😄', label: 'Very Happy' },
  happy: { emoji: '😊', label: 'Happy' },
  neutral: { emoji: '😐', label: 'Neutral' },
  sad: { emoji: '😢', label: 'Sad' },
  very_sad: { emoji: '😭', label: 'Very Sad' },
  anxious: { emoji: '😰', label: 'Anxious' },
  excited: { emoji: '🤩', label: 'Excited' },
  calm: { emoji: '😌', label: 'Calm' },
  angry: { emoji: '😠', label: 'Angry' },
  grateful: { emoji: '🙏', label: 'Grateful' }
};

// PUBLIC_INTERFACE
const ViewEntry = () => {
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const { id } = useParams();
  const { user } = useAuth();
  const { isOnline, getCachedEntry, deleteOfflineEntry } = useOffline();
  const navigate = useNavigate();

  useEffect(() => {
    loadEntry();
  }, [id, isOnline]);

  // PUBLIC_INTERFACE
  const loadEntry = async () => {
    try {
      setLoading(true);
      setError('');

      if (isOnline) {
        // Fetch from API when online
        const data = await entriesAPI.getEntry(id);
        setEntry(data);
      } else {
        // Get from cache when offline
        const cachedEntry = getCachedEntry(id);
        if (cachedEntry) {
          setEntry(cachedEntry);
        } else {
          setError('Entry not found in offline cache');
        }
      }
    } catch (err) {
      console.error('Failed to load entry:', err);
      
      // Try to get from cache as fallback
      const cachedEntry = getCachedEntry(id);
      if (cachedEntry) {
        setEntry(cachedEntry);
      } else {
        setError('Entry not found or failed to load');
      }
    } finally {
      setLoading(false);
    }
  };

  // PUBLIC_INTERFACE
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
      return;
    }

    setDeleteLoading(true);

    try {
      if (isOnline && !entry.isOffline) {
        // Delete from API when online
        await entriesAPI.deleteEntry(id);
      } else {
        // Delete from offline storage
        deleteOfflineEntry(id);
      }
      
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to delete entry:', err);
      setError('Failed to delete entry. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // PUBLIC_INTERFACE
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'EEEE, MMMM dd, yyyy \'at\' h:mm a');
    } catch {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-spinner">Loading entry...</div>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="container">
        <div className="error-state" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <h3>Entry Not Found</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            {error || 'The entry you\'re looking for doesn\'t exist or couldn\'t be loaded.'}
          </p>
          <Link to="/dashboard" className="btn btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const canEdit = entry.user_id === user?.id || entry.isOffline;

  return (
    <div className="container">
      <div className="entry-view">
        <div className="entry-header-section">
          <div className="entry-nav">
            <Link to="/dashboard" className="btn btn-secondary btn-small">
              ← Back to Dashboard
            </Link>
            
            {canEdit && (
              <div className="entry-actions">
                <Link 
                  to={`/entry/${id}/edit`} 
                  className="btn btn-primary btn-small"
                >
                  Edit Entry
                </Link>
                <button
                  onClick={handleDelete}
                  className="btn btn-danger btn-small"
                  disabled={deleteLoading}
                >
                  {deleteLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="error-message" style={{ 
              background: 'var(--error-color)', 
              color: 'white', 
              padding: '12px', 
              borderRadius: '8px', 
              marginTop: '20px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}
        </div>

        <article className="entry-content card">
          <header className="entry-meta">
            <h1 className="entry-title">{entry.title}</h1>
            
            <div className="entry-details">
              <div className="entry-date">
                {formatDate(entry.created_at)}
              </div>
              
              {entry.updated_at !== entry.created_at && (
                <div className="entry-updated" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Updated {formatDate(entry.updated_at)}
                </div>
              )}

              {entry.isOffline && (
                <div className="offline-badge" style={{
                  background: 'var(--warning-color)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  Saved Offline
                </div>
              )}

              {entry.is_private && (
                <div className="private-badge" style={{
                  background: 'var(--text-secondary)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  Private
                </div>
              )}
            </div>

            {entry.mood && (
              <div className="entry-mood-display" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '16px',
                padding: '12px',
                background: 'var(--bg-secondary)',
                borderRadius: '8px'
              }}>
                <span style={{ fontSize: '24px' }}>{MOODS[entry.mood]?.emoji}</span>
                <span style={{ fontWeight: '500' }}>Feeling {MOODS[entry.mood]?.label}</span>
              </div>
            )}

            {entry.tags && entry.tags.length > 0 && (
              <div className="entry-tags" style={{ marginTop: '16px' }}>
                {entry.tags.map((tag, index) => (
                  <span key={index} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          <div className="entry-body" style={{
            marginTop: '24px',
            lineHeight: '1.8',
            fontSize: '16px'
          }}>
            {entry.content.split('\n').map((paragraph, index) => (
              <p key={index} style={{ marginBottom: '16px' }}>
                {paragraph}
              </p>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
};

export default ViewEntry;
