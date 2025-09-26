import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Pi Network SDK init
if (window.Pi) {
  window.Pi.init({ version: "2.0" });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);