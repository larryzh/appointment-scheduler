import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import Navigation from './components/Navigation';
import ListManagementWithDragGroups from './components/ListManagementWithDragGroups';
import './App.css';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('lists');

  // Check if user is logged in
  const userId = localStorage.getItem('userId');
  if (userId) {
    return (
      <div className="app">
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="main-content">
          {activeTab === 'lists' && <ListManagementWithDragGroups />}
          {/* Add more tab content components here */}
        </div>
      </div>
    );
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Check if user exists with given email and password
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .eq('user_type', userType)
        .single();

      if (error) throw error;

      if (!data) {
        throw new Error('Invalid email or password');
      }

      // Store user info in localStorage
      localStorage.setItem('userId', data.id);
      localStorage.setItem('userEmail', data.email);
      localStorage.setItem('userType', data.user_type);

      // Redirect to dashboard
      window.location.reload();

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        throw new Error('Email already registered');
      }

      // Create new user
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            email,
            password,
            user_type: userType
          }
        ])
        .select()
        .single();

      if (error) throw error;

      alert('Registration successful! Please login.');
      window.location.href = '/login';

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Welcome</h1>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={window.location.pathname === '/signup' ? handleSignup : handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <select
          value={userType}
          onChange={(e) => setUserType(e.target.value)}
          required
        >
          <option value="">Select User Type</option>
          <option value="host">Host</option>
          <option value="visitor">Visitor</option>
        </select>
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : (window.location.pathname === '/signup' ? 'Sign Up' : 'Login')}
        </button>
      </form>
      <p>
        {window.location.pathname === '/signup' 
          ? <a href="/login">Already have an account? Login</a>
          : <a href="/signup">Don't have an account? Sign Up</a>
        }
      </p>
    </div>
  );
}

export default App;
