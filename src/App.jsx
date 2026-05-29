import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Payment from './pages/Payment';
import { getCurrentUser } from './services/mockDb';

// Wrapper untuk memproteksi rute privat (wajib login)
const ProtectedRoute = ({ children }) => {
  const user = getCurrentUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Wrapper untuk memproteksi rute publik (jika sudah login tidak bisa buka halaman ini lagi)
const PublicRoute = ({ children }) => {
  const user = getCurrentUser();
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Rute Publik */}
        <Route 
          path="/" 
          element={
            <PublicRoute>
              <Welcome />
            </PublicRoute>
          } 
        />
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } 
        />

        {/* Rute Privat */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/payment" 
          element={
            <ProtectedRoute>
              <Payment />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;