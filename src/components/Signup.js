import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            email: email,
          }
        }
      });

      if (error) {
        if (error.message.includes('not authorized')) {
          // Use test@test.com for demo purposes
          setError('Please use test@test.com for demo login');
        } else {
          setError(error.message);
        }
      } else if (data) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error) {
      setError(error.message);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <h2>Sign Up Successful</h2>
        <p className="success-message">
          Account created successfully! Redirecting to login...
        </p>
        <div className="auth-links">
          <Link to="/login">Click here if not redirected</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <h2>Sign Up</h2>
      <form onSubmit={handleSignup} className="auth-form">
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
        />
        <button type="submit">Sign Up</button>
        {error && <div className="error-message">{error}</div>}
        <div className="demo-info">
          For demo purposes, please use:
          <br />
          Email: test@test.com
          <br />
          Password: test123
        </div>
      </form>
      <div className="auth-links">
        Already have an account? <Link to="/login">Log In</Link>
      </div>
    </div>
  );
};

export default Signup;
