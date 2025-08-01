import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
const Search = () => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    mood: '',
    tags: '',
    dateFrom: '',
    dateTo: ''
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  
  const { user } = useAuth();
  const { isOnline, searchCachedEntries } = useOffline();
  const navigate = useNavigate();

  // PUBLIC_INTERFACE
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'query') {
      setQuery(value);
    } else {
      setFilters({
        ...filters,
        [name]: value
      });
    }
    if (error) setError('');
  };

  // PUBLIC_INTERFACE
  const handleSearch = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setError('');
    setHasSearched(true);

    try {
      if (isOnline) {
        // Search via API when online
        const searchFilters = {
          ...filters,
          limit: 50,
          offset: 0
        };
        
        const data = await entriesAPI.searchEntries(query, searchFilters);
        setResults(data.entries || []);
      } else {
        // Search cached entries when offline
        const searchFilters = {
          mood: filters.mood || undefined,
          tags: filters.tags ? filters.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined
        };
        
        const cachedResults = searchCachedEntries(query, searchFilters);
        setResults(cachedResults);
      }
    } catch (err) {
      console.error('Search failed:', err);
      setError('Search failed. Please try again.');
      
      // Fall back to cached search on error
      try {
        const searchFilters = {
          mood: filters.mood || undefined,
          tags: filters.tags ? filters.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined
        };
        
        const cachedResults = searchCachedEntries(query, searchFilters);
        setResults(cachedResults);
      } catch (cacheErr) {
        console.error('Cached search failed:', cacheErr);
      }
    } finally {
      setLoading(false);
    }
  };

  // PUBLIC_INTERFACE
  const clearSearch = () => {
    setQuery('');
    setFilters({
      mood: '',
      tags: '',
      dateFrom: '',
      dateTo: ''
    });
    setResults([]);
    setHasSearched(false);
    setError('');
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

  // PUBLIC_INTERFACE
  const highlightText = (text, searchQuery) => {
    if (!searchQuery.trim()) return text;
    
    const regex = new RegExp(`(${searchQuery.trim()})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <mark key={index} style={{ backgroundColor: 'var(--accent-color)', color: '#1f2937' }}>
          {part}
        </mark> : part
    );
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Search Entries</h1>
        <p className="page-subtitle">
          {isOnline ? 'Search your journal entries' : 'Searching cached entries only'}
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

      <div className="search-form">
        <form onSubmit={handleSearch}>
          <div className="form-group">
            <label htmlFor="query" className="form-label">
              Search Text
            </label>
            <input
              type="text"
              id="query"
              name="query"
              value={query}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Search in titles and content..."
              disabled={loading}
            />
          </div>

          <div className="search-filters">
            <div className="form-group">
              <label htmlFor="mood" className="form-label">
                Mood
              </label>
              <select
                id="mood"
                name="mood"
                value={filters.mood}
                onChange={handleInputChange}
                className="form-select"
                disabled={loading}
              >
                <option value="">Any mood</option>
                {Object.entries(MOODS).map(([key, mood]) => (
                  <option key={key} value={key}>
                    {mood.emoji} {mood.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="tags" className="form-label">
                Tags
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={filters.tags}
                onChange={handleInputChange}
                className="form-input"
                placeholder="work, personal, travel (comma-separated)"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="dateFrom" className="form-label">
                From Date
              </label>
              <input
                type="date"
                id="dateFrom"
                name="dateFrom"
                value={filters.dateFrom}
                onChange={handleInputChange}
                className="form-input"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="dateTo" className="form-label">
              To Date
            </label>
            <input
              type="date"
              id="dateTo"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleInputChange}
              className="form-input"
              disabled={loading}
            />
          </div>

          <div className="search-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
            
            <button
              type="button"
              onClick={clearSearch}
              className="btn btn-secondary"
              disabled={loading}
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {hasSearched && (
        <div className="search-results">
          <div className="results-header" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px' 
          }}>
            <h2 className="results-title">
              {loading ? 'Searching...' : `${results.length} result${results.length !== 1 ? 's' : ''} found`}
            </h2>
          </div>

          {results.length === 0 && !loading ? (
            <div className="empty-state" style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
              <h3>No entries found</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Try adjusting your search terms or filters
              </p>
            </div>
          ) : (
            <div className="results-list">
              {results.map((entry) => (
                <div 
                  key={entry.id} 
                  className="entry-card"
                  onClick={() => handleEntryClick(entry.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="entry-header">
                    <div>
                      <h3 className="entry-title">
                        {query ? highlightText(entry.title, query) : entry.title}
                      </h3>
                      <div className="entry-date">{formatDate(entry.created_at)}</div>
                    </div>
                    <div className="entry-indicators">
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
                      {entry.is_private && (
                        <div className="private-indicator" title="Private entry">
                          🔒
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="entry-preview">
                    {query ? highlightText(truncateContent(entry.content), query) : truncateContent(entry.content)}
                  </div>

                  {entry.tags && entry.tags.length > 0 && (
                    <div className="entry-tags">
                      {entry.tags.slice(0, 5).map((tag, index) => {
                        const isHighlighted = filters.tags && 
                          filters.tags.split(',').map(t => t.trim().toLowerCase()).includes(tag.toLowerCase());
                        
                        return (
                          <span 
                            key={index} 
                            className="tag"
                            style={isHighlighted ? {
                              backgroundColor: 'var(--accent-color)',
                              color: '#1f2937'
                            } : {}}
                          >
                            {tag}
                          </span>
                        );
                      })}
                      {entry.tags.length > 5 && (
                        <span className="tag">+{entry.tags.length - 5} more</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;
