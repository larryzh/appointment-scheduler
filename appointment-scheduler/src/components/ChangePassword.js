import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const ChangePassword = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.auth.api.resetPasswordForEmail(email);
      if (error) throw error;
      alert('Password reset email sent. Please check your inbox.');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div>
      <h2>Change Password</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">Reset Password</button>
      </form>
      <p>
        <Link to="/">Back to Login</Link>
      </p>
    </div>
  );
};

export default ChangePassword;