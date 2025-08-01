import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://vscode-internal-37773-beta.beta01.cloud.kavia.ai:3001';

// Configure axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Journal Entries API
// PUBLIC_INTERFACE
export const entriesAPI = {
  // Get all entries for the current user
  getEntries: async (limit = 20, offset = 0) => {
    const response = await api.get(`/api/entries?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  // Get a specific entry by ID
  getEntry: async (id) => {
    const response = await api.get(`/api/entries/${id}`);
    return response.data;
  },

  // Create a new entry
  createEntry: async (entryData) => {
    const response = await api.post('/api/entries', entryData);
    return response.data;
  },

  // Update an existing entry
  updateEntry: async (id, entryData) => {
    const response = await api.put(`/api/entries/${id}`, entryData);
    return response.data;
  },

  // Delete an entry
  deleteEntry: async (id) => {
    const response = await api.delete(`/api/entries/${id}`);
    return response.data;
  },

  // Search entries
  searchEntries: async (query, filters = {}) => {
    const params = new URLSearchParams();
    
    if (query) params.append('query', query);
    if (filters.mood) params.append('mood', filters.mood);
    if (filters.tags) params.append('tags', filters.tags);
    if (filters.dateFrom) params.append('date_from', filters.dateFrom);
    if (filters.dateTo) params.append('date_to', filters.dateTo);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);

    const response = await api.get(`/api/entries/search/query?${params.toString()}`);
    return response.data;
  }
};

// Export API
// PUBLIC_INTERFACE
export const exportAPI = {
  // Export entries
  exportEntries: async (format, filters = {}) => {
    const params = new URLSearchParams();
    params.append('export_format', format);
    
    if (filters.dateFrom) params.append('date_from', filters.dateFrom);
    if (filters.dateTo) params.append('date_to', filters.dateTo);
    if (filters.includePrivate !== undefined) params.append('include_private', filters.includePrivate);

    const response = await api.post(`/api/export/entries?${params.toString()}`);
    return response.data;
  },

  // Download exported file
  downloadFile: async (filename) => {
    const response = await api.get(`/api/export/download/${filename}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Cleanup old export files
  cleanupExports: async () => {
    const response = await api.delete('/api/export/cleanup');
    return response.data;
  }
};

// Health API
// PUBLIC_INTERFACE
export const healthAPI = {
  // Basic health check
  healthCheck: async () => {
    const response = await api.get('/');
    return response.data;
  },

  // Detailed health check
  detailedHealthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  // API info
  apiInfo: async () => {
    const response = await api.get('/api/info');
    return response.data;
  }
};

export default api;
