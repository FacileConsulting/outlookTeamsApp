import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useIsAuthenticated } from '@azure/msal-react';
import Login from './components/Login';
import EmailApp from './components/EmailApp';
import './App.css';

function App() {
  const isAuthenticated = useIsAuthenticated();

  return (
    <div className="App">
      <Routes>
        <Route 
          path="/login" 
          element={!isAuthenticated ? <Login /> : <Navigate to="/" />} 
        />
        <Route 
          path="/*" 
          element={isAuthenticated ? <EmailApp /> : <Navigate to="/login" />} 
        />
      </Routes>
    </div>
  );
}

export default App;

