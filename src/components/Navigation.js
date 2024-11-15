import React from 'react';
import './Navigation.css';

function Navigation({ activeTab, onTabChange }) {
  return (
    <nav className="navigation">
      <div className="nav-tabs">
        <button 
          className={`nav-tab ${activeTab === 'lists' ? 'active' : ''}`}
          onClick={() => onTabChange('lists')}
        >
          List Management
        </button>
        {/* Add more tabs here as needed */}
      </div>
      <button 
        className="logout-button" 
        onClick={() => {
          localStorage.clear();
          window.location.href = '/login';
        }}
      >
        Logout
      </button>
    </nav>
  );
}

export default Navigation;
