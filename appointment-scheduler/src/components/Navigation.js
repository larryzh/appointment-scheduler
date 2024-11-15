import React from 'react';
import { Link, useHistory } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Navigation = () => {
  const history = useHistory();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      history.push('/');
    } catch (error) {
      console.error('Error logging out:', error.message);
    }
  };

  return (
    <nav>
      <ul>
        <li><Link to="/host-dashboard">Host Dashboard</Link></li>
        <li><Link to="/visitor-dashboard">Visitor Dashboard</Link></li>
        <li><button onClick={handleLogout}>Logout</button></li>
      </ul>
    </nav>
  );
};

export default Navigation;