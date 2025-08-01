import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import components
import Header from './components/Layout/Header';
import Home from './components/Pages/Home';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Pages/Dashboard';
import NewEntry from './components/Entries/NewEntry';
import EditEntry from './components/Entries/EditEntry';
import ViewEntry from './components/Entries/ViewEntry';
import Calendar from './components/Pages/Calendar';
import Search from './components/Pages/Search';
import Export from './components/Pages/Export';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { OfflineProvider } from './contexts/OfflineContext';

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  // Effect to apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <AuthProvider>
      <OfflineProvider>
        <Router>
          <div className="App" data-theme={theme}>
            <Header theme={theme} toggleTheme={toggleTheme} />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/new-entry" element={<ProtectedRoute><NewEntry /></ProtectedRoute>} />
                <Route path="/entry/:id" element={<ProtectedRoute><ViewEntry /></ProtectedRoute>} />
                <Route path="/entry/:id/edit" element={<ProtectedRoute><EditEntry /></ProtectedRoute>} />
                <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
                <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
                <Route path="/export" element={<ProtectedRoute><Export /></ProtectedRoute>} />
              </Routes>
            </main>
          </div>
        </Router>
      </OfflineProvider>
    </AuthProvider>
  );
}

// Protected Route component
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
}

// Public Route component (redirect to dashboard if already authenticated)
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }
  
  return user ? <Navigate to="/dashboard" /> : children;
}

export default App;
