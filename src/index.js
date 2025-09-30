import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// (Pi SDK init now handled inside AuthProvider with retry logic)

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);