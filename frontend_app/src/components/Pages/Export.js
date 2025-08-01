import React, { useState } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { useOffline } from '../../contexts/OfflineContext';
import { exportAPI } from '../../services/api';

// PUBLIC_INTERFACE
const Export = () => {
  const [exportFormat, setExportFormat] = useState('txt');
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    includePrivate: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { user } = useAuth();
  const { isOnline, cachedEntries } = useOffline();

  // PUBLIC_INTERFACE
  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters({
      ...filters,
      [name]: type === 'checkbox' ? checked : value
    });
    if (error) setError('');
    if (success) setSuccess('');
  };

  // PUBLIC_INTERFACE
  const handleFormatChange = (format) => {
    setExportFormat(format);
    if (error) setError('');
    if (success) setSuccess('');
  };

  // PUBLIC_INTERFACE
  const generateOfflineExport = () => {
    let filteredEntries = [...cachedEntries];

    // Apply date filters
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filteredEntries = filteredEntries.filter(entry => 
        new Date(entry.created_at) >= fromDate
      );
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      filteredEntries = filteredEntries.filter(entry => 
        new Date(entry.created_at) <= toDate
      );
    }

    // Apply privacy filter
    if (!filters.includePrivate) {
      filteredEntries = filteredEntries.filter(entry => !entry.is_private);
    }

    // Sort by date
    filteredEntries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return filteredEntries;
  };

  // PUBLIC_INTERFACE
  const downloadOfflineExport = (entries, format) => {
    let content = '';
    let mimeType = 'text/plain';
    let fileName = `journal_export_${format(new Date(), 'yyyy-MM-dd')}.${format}`;

    if (format === 'txt') {
      content = generateTextExport(entries);
      mimeType = 'text/plain';
    } else if (format === 'pdf') {
      // For PDF, we'll generate HTML content that can be saved as PDF by the browser
      content = generateHTMLExport(entries);
      mimeType = 'text/html';
      fileName = `journal_export_${format(new Date(), 'yyyy-MM-dd')}.html`;
    }

    // Create and download file
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // PUBLIC_INTERFACE
  const generateTextExport = (entries) => {
    let content = `Journal Export - ${format(new Date(), 'EEEE, MMMM dd, yyyy')}\n`;
    content += `Total Entries: ${entries.length}\n`;
    content += '=' .repeat(50) + '\n\n';

    entries.forEach((entry, index) => {
      content += `Entry ${index + 1}\n`;
      content += '-'.repeat(20) + '\n';
      content += `Title: ${entry.title}\n`;
      content += `Date: ${format(new Date(entry.created_at), 'EEEE, MMMM dd, yyyy \'at\' h:mm a')}\n`;
      
      if (entry.mood) {
        const moodLabels = {
          very_happy: 'Very Happy',
          happy: 'Happy',
          neutral: 'Neutral',
          sad: 'Sad',
          very_sad: 'Very Sad',
          anxious: 'Anxious',
          excited: 'Excited',
          calm: 'Calm',
          angry: 'Angry',
          grateful: 'Grateful'
        };
        content += `Mood: ${moodLabels[entry.mood] || entry.mood}\n`;
      }
      
      if (entry.tags && entry.tags.length > 0) {
        content += `Tags: ${entry.tags.join(', ')}\n`;
      }
      
      if (entry.is_private) {
        content += `Privacy: Private\n`;
      }
      
      content += '\nContent:\n';
      content += entry.content + '\n\n';
      content += '=' . repeat(50) + '\n\n';
    });

    return content;
  };

  // PUBLIC_INTERFACE
  const generateHTMLExport = (entries) => {
    let html = `
<!DOCTYPE html>
<html>
<head>
    <title>Journal Export</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .entry { margin-bottom: 30px; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .entry-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
        .entry-meta { color: #666; margin-bottom: 15px; font-size: 14px; }
        .entry-content { line-height: 1.6; white-space: pre-wrap; }
        .tags { margin-top: 15px; }
        .tag { background: #f0f0f0; padding: 2px 8px; border-radius: 4px; margin-right: 5px; font-size: 12px; }
        @media print { body { margin: 0; } .entry { page-break-inside: avoid; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>Journal Export</h1>
        <p>Generated on ${format(new Date(), 'EEEE, MMMM dd, yyyy')}</p>
        <p>Total Entries: ${entries.length}</p>
    </div>
`;

    entries.forEach(entry => {
      html += `
    <div class="entry">
        <div class="entry-title">${entry.title}</div>
        <div class="entry-meta">
            ${format(new Date(entry.created_at), 'EEEE, MMMM dd, yyyy \'at\' h:mm a')}
            ${entry.mood ? ` • Mood: ${entry.mood}` : ''}
            ${entry.is_private ? ' • Private' : ''}
        </div>
        <div class="entry-content">${entry.content}</div>
        ${entry.tags && entry.tags.length > 0 ? `
        <div class="tags">
            ${entry.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
        ` : ''}
    </div>
`;
    });

    html += `
</body>
</html>
`;

    return html;
  };

  // PUBLIC_INTERFACE
  const handleExport = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isOnline) {
        // Export via API when online
        const exportData = await exportAPI.exportEntries(exportFormat, filters);
        
        if (exportData.download_url) {
          // Download the file
          const link = document.createElement('a');
          link.href = exportData.download_url;
          link.download = exportData.filename || `journal_export.${exportFormat}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          setSuccess('Export completed successfully!');
        } else {
          throw new Error('Export failed - no download URL provided');
        }
      } else {
        // Generate offline export
        const entries = generateOfflineExport();
        
        if (entries.length === 0) {
          setError('No entries found matching your criteria.');
          return;
        }
        
        downloadOfflineExport(entries, exportFormat);
        setSuccess(`Exported ${entries.length} entries successfully!`);
      }
    } catch (err) {
      console.error('Export failed:', err);
      
      // Try offline export as fallback
      try {
        const entries = generateOfflineExport();
        
        if (entries.length === 0) {
          setError('No entries found matching your criteria.');
          return;
        }
        
        downloadOfflineExport(entries, exportFormat);
        setSuccess(`Exported ${entries.length} entries successfully! (offline mode)`);
      } catch (offlineErr) {
        setError('Export failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Export Journal</h1>
        <p className="page-subtitle">
          {isOnline ? 'Export your journal entries to a file' : 'Exporting cached entries only'}
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

      {success && (
        <div className="success-message" style={{ 
          background: 'var(--success-color)', 
          color: 'white', 
          padding: '12px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          {success}
        </div>
      )}

      <div className="export-form card">
        <form onSubmit={handleExport}>
          <div className="form-group">
            <label className="form-label">Export Format</label>
            <div className="export-options">
              <div 
                className={`export-option ${exportFormat === 'txt' ? 'selected' : ''}`}
                onClick={() => handleFormatChange('txt')}
                style={{
                  border: `2px solid ${exportFormat === 'txt' ? 'var(--primary-color)' : 'var(--border-color)'}`,
                  borderRadius: '8px',
                  padding: '20px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'border-color 0.2s ease'
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📄</div>
                <h3>Text File (.txt)</h3>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                  Simple text format, compatible with all devices
                </p>
              </div>

              <div 
                className={`export-option ${exportFormat === 'pdf' ? 'selected' : ''}`}
                onClick={() => handleFormatChange('pdf')}
                style={{
                  border: `2px solid ${exportFormat === 'pdf' ? 'var(--primary-color)' : 'var(--border-color)'}`,
                  borderRadius: '8px',
                  padding: '20px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'border-color 0.2s ease'
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
                <h3>HTML File (.html)</h3>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                  Formatted document, can be saved as PDF
                </p>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Date Range (Optional)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label htmlFor="dateFrom" className="form-label">From Date</label>
                <input
                  type="date"
                  id="dateFrom"
                  name="dateFrom"
                  value={filters.dateFrom}
                  onChange={handleFilterChange}
                  className="form-input"
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="dateTo" className="form-label">To Date</label>
                <input
                  type="date"
                  id="dateTo"
                  name="dateTo"
                  value={filters.dateTo}
                  onChange={handleFilterChange}
                  className="form-input"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="includePrivate"
                checked={filters.includePrivate}
                onChange={handleFilterChange}
                disabled={loading}
              />
              <span style={{ marginLeft: '8px' }}>Include private entries</span>
            </label>
          </div>

          <div className="form-actions" style={{ textAlign: 'center' }}>
            <button
              type="submit"
              className="btn btn-primary btn-large"
              disabled={loading}
            >
              {loading ? 'Exporting...' : `Export as ${exportFormat.toUpperCase()}`}
            </button>
          </div>
        </form>
      </div>

      <div className="export-info card" style={{ marginTop: '30px' }}>
        <h3>Export Information</h3>
        <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          <li>All exported data remains private and is downloaded directly to your device</li>
          <li>Text files can be opened in any text editor or word processor</li>
          <li>HTML files can be viewed in any web browser and saved as PDF</li>
          {!isOnline && <li><strong>Offline mode:</strong> Only cached entries will be exported</li>}
          <li>Private entries are included by default but can be excluded</li>
          <li>Entries are sorted by date (newest first) in the export</li>
        </ul>
      </div>
    </div>
  );
};

export default Export;
