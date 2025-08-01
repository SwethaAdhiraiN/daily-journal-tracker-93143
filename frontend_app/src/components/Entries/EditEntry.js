import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
const EditEntry = () => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    mood: '',
    tags: '',
    is_private: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [originalEntry, setOriginalEntry] = useState(null);
  
  const { id } = useParams();
  const { user } = useAuth();
  const { isOnline, getCachedEntry, updateOfflineEntry } = useOffline();
  const navigate = useNavigate();

  useEffect(() => {
    loadEntry();
  }, [id, isOnline]);

  // PUBLIC_INTERFACE
  const loadEntry = async () => {
    try {
      setLoading(true);
      setError('');

      let entry;
      if (isOnline) {
        // Fetch from API when online
        entry = await entriesAPI.getEntry(id);
      } else {
        // Get from cache when offline
        entry = getCachedEntry(id);
        if (!entry) {
          setError('Entry not found in offline cache');
          return;
        }
      }

      // Check if user can edit this entry
      if (entry.user_id !== user?.id && !entry.isOffline) {
        setError('You don\'t have permission to edit this entry');
        return;
      }

      setOriginalEntry(entry);
      setFormData({
        title: entry.title || '',
        content: entry.content || '',
        mood: entry.mood || '',
        tags: entry.tags ? entry.tags.join(', ') : '',
        is_private: entry.is_private || false
      });
    } catch (err) {
      console.error('Failed to load entry:', err);
      
      // Try to get from cache as fallback
      const cachedEntry = getCachedEntry(id);
      if (cachedEntry && (cachedEntry.user_id === user?.id || cachedEntry.isOffline)) {
        setOriginalEntry(cachedEntry);
        setFormData({
          title: cachedEntry.title || '',
          content: cachedEntry.content || '',
          mood: cachedEntry.mood || '',
          tags: cachedEntry.tags ? cachedEntry.tags.join(', ') : '',
          is_private: cachedEntry.is_private || false
        });
      } else {
        setError('Failed to load entry for editing');
      }
    } finally {
      setLoading(false);
    }
  };

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

    setSaving(true);
    setError('');

    try {
      const updateData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        mood: formData.mood || null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        is_private: formData.is_private
      };

      if (isOnline && !originalEntry.isOffline) {
        // Update via API when online
        await entriesAPI.updateEntry(id, updateData);
      } else {
        // Update offline entry
        updateOfflineEntry(id, updateData);
      }
      
      navigate(`/entry/${id}`);
    } catch (err) {
      console.error('Failed to update entry:', err);
      
      // Try to update offline as fallback
      try {
        const updateData = {
          title: formData.title.trim(),
          content: formData.content.trim(),
          mood: formData.mood || null,
          tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
          is_private: formData.is_private
        };
        
        updateOfflineEntry(id, updateData);
        navigate(`/entry/${id}`);
      } catch (offlineErr) {
        setError('Failed to update entry. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-spinner">Loading entry...</div>
      </div>
    );
  }

  if (error && !originalEntry) {
    return (
      <div className="container">
        <div className="error-state" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <h3>Cannot Edit Entry</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            {error}
          </p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Edit Entry</h1>
        <p className="page-subtitle">
          {isOnline && !originalEntry?.isOffline ? 'Changes will be saved to the cloud' : 'Changes will be saved locally'}
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
              disabled={saving}
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
              disabled={saving}
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
              disabled={saving}
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
                disabled={saving}
              />
              <span style={{ marginLeft: '8px' }}>Make this entry private</span>
            </label>
          </div>

          <div className="form-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => navigate(`/entry/${id}`)}
              className="btn btn-secondary"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEntry;
