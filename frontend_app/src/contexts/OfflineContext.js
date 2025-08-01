import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const OfflineContext = createContext();

// PUBLIC_INTERFACE
export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};

// PUBLIC_INTERFACE
export const OfflineProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineEntries, setOfflineEntries] = useState([]);
  const [cachedEntries, setCachedEntries] = useState([]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load cached data from localStorage on mount
  useEffect(() => {
    const loadCachedData = () => {
      try {
        const cached = localStorage.getItem('cachedEntries');
        const offline = localStorage.getItem('offlineEntries');
        
        if (cached) {
          setCachedEntries(JSON.parse(cached));
        }
        
        if (offline) {
          setOfflineEntries(JSON.parse(offline));
        }
      } catch (error) {
        console.error('Failed to load cached data:', error);
      }
    };

    loadCachedData();
  }, []);

  // PUBLIC_INTERFACE
  const cacheEntries = (entries) => {
    try {
      setCachedEntries(entries);
      localStorage.setItem('cachedEntries', JSON.stringify(entries));
    } catch (error) {
      console.error('Failed to cache entries:', error);
    }
  };

  // PUBLIC_INTERFACE
  const addOfflineEntry = (entry) => {
    try {
      const offlineEntry = {
        ...entry,
        id: uuidv4(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        isOffline: true
      };

      const updatedOfflineEntries = [...offlineEntries, offlineEntry];
      setOfflineEntries(updatedOfflineEntries);
      localStorage.setItem('offlineEntries', JSON.stringify(updatedOfflineEntries));

      // Also add to cached entries for immediate display
      const updatedCachedEntries = [offlineEntry, ...cachedEntries];
      setCachedEntries(updatedCachedEntries);
      localStorage.setItem('cachedEntries', JSON.stringify(updatedCachedEntries));

      return offlineEntry;
    } catch (error) {
      console.error('Failed to add offline entry:', error);
      return null;
    }
  };

  // PUBLIC_INTERFACE
  const updateOfflineEntry = (id, updates) => {
    try {
      const updatedOfflineEntries = offlineEntries.map(entry =>
        entry.id === id ? { ...entry, ...updates, updated_at: new Date().toISOString() } : entry
      );
      
      setOfflineEntries(updatedOfflineEntries);
      localStorage.setItem('offlineEntries', JSON.stringify(updatedOfflineEntries));

      // Update cached entries too
      const updatedCachedEntries = cachedEntries.map(entry =>
        entry.id === id ? { ...entry, ...updates, updated_at: new Date().toISOString() } : entry
      );
      
      setCachedEntries(updatedCachedEntries);
      localStorage.setItem('cachedEntries', JSON.stringify(updatedCachedEntries));

      return true;
    } catch (error) {
      console.error('Failed to update offline entry:', error);
      return false;
    }
  };

  // PUBLIC_INTERFACE
  const deleteOfflineEntry = (id) => {
    try {
      const updatedOfflineEntries = offlineEntries.filter(entry => entry.id !== id);
      setOfflineEntries(updatedOfflineEntries);
      localStorage.setItem('offlineEntries', JSON.stringify(updatedOfflineEntries));

      // Remove from cached entries too
      const updatedCachedEntries = cachedEntries.filter(entry => entry.id !== id);
      setCachedEntries(updatedCachedEntries);
      localStorage.setItem('cachedEntries', JSON.stringify(updatedCachedEntries));

      return true;
    } catch (error) {
      console.error('Failed to delete offline entry:', error);
      return false;
    }
  };

  // PUBLIC_INTERFACE
  const clearOfflineEntries = () => {
    try {
      setOfflineEntries([]);
      localStorage.removeItem('offlineEntries');
      return true;
    } catch (error) {
      console.error('Failed to clear offline entries:', error);
      return false;
    }
  };

  // PUBLIC_INTERFACE
  const getCachedEntry = (id) => {
    return cachedEntries.find(entry => entry.id === id);
  };

  // PUBLIC_INTERFACE
  const searchCachedEntries = (query, filters = {}) => {
    return cachedEntries.filter(entry => {
      // Text search
      if (query) {
        const searchText = query.toLowerCase();
        const titleMatch = entry.title?.toLowerCase().includes(searchText);
        const contentMatch = entry.content?.toLowerCase().includes(searchText);
        if (!titleMatch && !contentMatch) return false;
      }

      // Mood filter
      if (filters.mood && entry.mood !== filters.mood) {
        return false;
      }

      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        if (!entry.tags || !filters.tags.some(tag => entry.tags.includes(tag))) {
          return false;
        }
      }

      // Date filters
      if (filters.dateFrom) {
        const entryDate = new Date(entry.created_at);
        const fromDate = new Date(filters.dateFrom);
        if (entryDate < fromDate) return false;
      }

      if (filters.dateTo) {
        const entryDate = new Date(entry.created_at);
        const toDate = new Date(filters.dateTo);
        if (entryDate > toDate) return false;
      }

      return true;
    });
  };

  const value = {
    isOnline,
    offlineEntries,
    cachedEntries,
    cacheEntries,
    addOfflineEntry,
    updateOfflineEntry,
    deleteOfflineEntry,
    clearOfflineEntries,
    getCachedEntry,
    searchCachedEntries
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};
