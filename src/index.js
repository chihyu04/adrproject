import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './app'; // 注意你的檔案名稱是小寫 app.js 就寫 app

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);