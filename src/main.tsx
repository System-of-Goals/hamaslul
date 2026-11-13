import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/rubik/500.css';
import '@fontsource/rubik/700.css';
import '@fontsource/heebo/400.css';
import '@fontsource/heebo/600.css';
import './styles/global.css';
import './lib/install'; // start listening for the install prompt early
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
