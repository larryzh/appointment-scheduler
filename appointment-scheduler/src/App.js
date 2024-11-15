import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Login from './components/Login';
import Signup from './components/Signup';
import ChangePassword from './components/ChangePassword';
import HostDashboard from './components/HostDashboard';
import VisitorDashboard from './components/VisitorDashboard';
import Navigation from './components/Navigation';

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    setSession(supabase.auth.session());

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  return (
    <Router>
      <div className="App">
        {session && <Navigation />}
        <Routes>
          <Route path="/" element={!session ? <Login /> : <Navigate to="/host-dashboard" />} />
          <Route path="/signup" element={!session ? <Signup /> : <Navigate to="/host-dashboard" />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route
            path="/host-dashboard"
            element={session ? <HostDashboard /> : <Navigate to="/" />}
          />
          <Route
            path="/visitor-dashboard"
            element={session ? <VisitorDashboard /> : <Navigate to="/" />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;