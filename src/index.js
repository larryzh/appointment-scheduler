import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { setupDatabase } from './setupDatabase';
import './App.css';

const init = async () => {
  try {
    console.log('Starting application initialization...');
    
    // Setup database tables and policies
    await setupDatabase();
    console.log('Database setup completed');

    // Create root and render app
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error('Error during initialization:', error);
    // Show error to user
    document.body.innerHTML = `
      <div style="color: red; padding: 20px;">
        Error initializing application. Please check console for details.
      </div>
    `;
  }
};

// Start the application
init();
