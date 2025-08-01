import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
const NewEntry = () => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    mood: '',
    tags: '',
    is_private: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { user } = useAuth();
  const { isOnline, addOfflineEntry } = useOffline();
  const navigate = useNavigate();

  // PUBLIC_INTERFACE
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    if (error) setError('');
  };

  // PUBLIC_INTERFACE
  const handleMoodSelect = (mood) => {
    setFormData({
      ...formData,
      mood: formData.mood === mood ? '' : mood
    });
  };

  // PUBLIC_INTERFACE
  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!formData.content.trim()) {
      setError('Content is required');
      return false;
    }
    if (formData.title.length > 200) {
      setError('Title must be less than 200 characters');
      return false;
    }
    if (formData.content.length > 10000) {
      setError('Content must be less than 10,000 characters');
      return false;
    }
    return true;
  };

  // PUBLIC_INTERFACE
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const entryData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        mood: formData.mood || null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        is_private: formData.is_private
      };

      if (isOnline) {
        // Save to API when online
        const newEntry = await entriesAPI.createEntry(entryData);
        navigate(`/entry/${newEntry.id}`);
      } else {
        // Save offline when not connected
        const offlineEntry = addOfflineEntry(entryData);
        if (offlineEntry) {
          navigate(`/entry/${offlineEntry.id}`);
        } else {
          setError('Failed to save entry offline. Please try again.');
        }
      }
    } catch (err) {
      console.error('Failed to create entry:', err);
      
      // Try to save offline as fallback
      try {
        const entryData = {
          title: formData.title.trim(),
          content: formData.content.trim(),
          mood: formData.mood || null,
          tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
          is_private: formData.is_private
        };
        
        const offlineEntry = addOfflineEntry(entryData);
        if (offlineEntry) {
          navigate(`/entry/${offlineEntry.id}`);
        } else {
          setError('Failed to create entry. Please try again.');
        }
      } catch (offlineErr) {
        setError('Failed to create entry. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Write New Entry</h1>
        <p className="page-subtitle">
          {isOnline ? 'Your entry will be saved to the cloud' : 'You\'re offline - entry will be saved locally'}
        </p>
      </div>

      <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit}>
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

          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="form-input"
              required
              disabled={loading}
              placeholder="Give your entry a title..."
              maxLength={200}
            />
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'right' }}>
              {formData.title.length}/200
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="content" className="form-label">
              Content *
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              className="form-textarea"
              required
              disabled={loading}
              placeholder="Write about your day, thoughts, experiences..."
              rows={8}
              maxLength={10000}
            />
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'right' }}>
              {formData.content.length}/10,000
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">How are you feeling?</label>
            <div className="mood-grid">
              {Object.entries(MOODS).map(([key, mood]) => (
                <div
                  key={key}
                  className={`mood-item ${formData.mood === key ? 'selected' : ''}`}
                  onClick={() => handleMoodSelect(key)}
                >
                  <div className="mood-emoji">{mood.emoji}</div>
                  <div className="mood-label">{mood.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="tags" className="form-label">
              Tags
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="form-input"
              disabled={loading}
              placeholder="work, personal, travel, goals (comma-separated)"
            />
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Separate tags with commas
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="is_private"
                checked={formData.is_private}
                onChange={handleChange}
                disabled={loading}
              />
              <span style={{ marginLeft: '8px' }}>Make this entry private</span>
            </label>
          </div>

          <div className="form-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewEntry;
