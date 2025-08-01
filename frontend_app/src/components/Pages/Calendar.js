import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { useOffline } from '../../contexts/OfflineContext';
import { entriesAPI } from '../../services/api';

// PUBLIC_INTERFACE
const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEntries, setSelectedEntries] = useState([]);
  
  const { user } = useAuth();
  const { isOnline, cachedEntries } = useOffline();
  const navigate = useNavigate();

  useEffect(() => {
    loadEntries();
  }, [currentDate, isOnline, cachedEntries]);

  // PUBLIC_INTERFACE
  const loadEntries = async () => {
    try {
      setLoading(true);
      setError('');

      if (isOnline) {
        // Fetch from API when online
        const data = await entriesAPI.getEntries(1000, 0); // Get more entries for calendar view
        setEntries(data.entries || []);
      } else {
        // Use cached entries when offline
        setEntries(cachedEntries);
      }
    } catch (err) {
      console.error('Failed to load entries:', err);
      setError('Failed to load entries. Please try again.');
      
      // Fall back to cached entries on error
      setEntries(cachedEntries);
    } finally {
      setLoading(false);
    }
  };

  // PUBLIC_INTERFACE
  const getEntriesForDate = (date) => {
    return entries.filter(entry => 
      isSameDay(new Date(entry.created_at), date)
    );
  };

  // PUBLIC_INTERFACE
  const handleDateClick = (date) => {
    const dateEntries = getEntriesForDate(date);
    setSelectedDate(date);
    setSelectedEntries(dateEntries);
  };

  // PUBLIC_INTERFACE
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
    setSelectedDate(null);
    setSelectedEntries([]);
  };

  // PUBLIC_INTERFACE
  const formatDate = (date) => {
    return format(date, 'MMMM yyyy');
  };

  // PUBLIC_INTERFACE
  const truncateContent = (content, maxLength = 100) => {
    if (!content) return '';
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get starting day of week (0 = Sunday, 1 = Monday, etc.)
  const startDay = monthStart.getDay();
  const emptyDays = Array(startDay).fill(null);

  if (loading) {
    return (
      <div className="container">
        <div className="loading-spinner">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Journal Calendar</h1>
        <p className="page-subtitle">
          {isOnline ? 'View your entries by date' : 'Viewing cached entries'}
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

      <div className="calendar-container" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
        <div className="calendar card">
          <div className="calendar-header">
            <button 
              onClick={() => navigateMonth(-1)}
              className="calendar-nav"
              title="Previous month"
            >
              ‹
            </button>
            
            <h2 className="calendar-month">{formatDate(currentDate)}</h2>
            
            <button 
              onClick={() => navigateMonth(1)}
              className="calendar-nav"
              title="Next month"
            >
              ›
            </button>
          </div>

          <div className="calendar-weekdays" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '1px',
            marginBottom: '10px',
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--text-secondary)'
          }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} style={{ padding: '8px', textAlign: 'center' }}>
                {day}
              </div>
            ))}
          </div>

          <div className="calendar-grid">
            {emptyDays.map((_, index) => (
              <div key={`empty-${index}`} className="calendar-day empty"></div>
            ))}
            
            {daysInMonth.map(date => {
              const dayEntries = getEntriesForDate(date);
              const hasEntries = dayEntries.length > 0;
              const isSelected = selectedDate && isSameDay(date, selectedDate);
              const isTodayDate = isToday(date);

              return (
                <div
                  key={date.toISOString()}
                  className={`calendar-day ${hasEntries ? 'has-entry' : ''} ${isTodayDate ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleDateClick(date)}
                  style={{
                    position: 'relative',
                    cursor: 'pointer'
                  }}
                >
                  <span className="day-number">{format(date, 'd')}</span>
                  {hasEntries && (
                    <div className="entry-indicator" style={{
                      position: 'absolute',
                      bottom: '4px',
                      right: '4px',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary-color)'
                    }} />
                  )}
                  {dayEntries.length > 1 && (
                    <div className="entry-count" style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      fontSize: '10px',
                      backgroundColor: 'var(--accent-color)',
                      color: '#1f2937',
                      borderRadius: '8px',
                      padding: '2px 4px',
                      fontWeight: '500'
                    }}>
                      {dayEntries.length}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {selectedDate && (
          <div className="selected-date-entries card">
            <div className="card-header">
              <h3 className="card-title">
                {format(selectedDate, 'EEEE, MMMM dd, yyyy')}
              </h3>
              {selectedEntries.length === 0 && (
                <button
                  onClick={() => navigate('/new-entry')}
                  className="btn btn-primary btn-small"
                >
                  + Add Entry
                </button>
              )}
            </div>

            {selectedEntries.length === 0 ? (
              <div className="empty-state" style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📝</div>
                <p style={{ color: 'var(--text-secondary)' }}>
                  No entries for this date
                </p>
              </div>
            ) : (
              <div className="date-entries">
                {selectedEntries.map(entry => (
                  <div
                    key={entry.id}
                    className="entry-card"
                    onClick={() => navigate(`/entry/${entry.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="entry-header">
                      <h4 className="entry-title">{entry.title}</h4>
                      {entry.mood && (
                        <div className="entry-mood">
                          {entry.mood === 'very_happy' && '😄'}
                          {entry.mood === 'happy' && '😊'}
                          {entry.mood === 'neutral' && '😐'}
                          {entry.mood === 'sad' && '😢'}
                          {entry.mood === 'very_sad' && '😭'}
                          {entry.mood === 'anxious' && '😰'}
                          {entry.mood === 'excited' && '🤩'}
                          {entry.mood === 'calm' && '😌'}
                          {entry.mood === 'angry' && '😠'}
                          {entry.mood === 'grateful' && '🙏'}
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
        )}
      </div>
    </div>
  );
};

export default Calendar;
