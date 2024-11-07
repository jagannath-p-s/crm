import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';

const PrivateRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  return user && new Date().getTime() < user.expiry ? children : <Navigate to="/login" />;
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
      </Routes>
    </Router>
  );
};

export default App;
