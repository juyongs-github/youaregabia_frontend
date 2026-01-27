import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import './index.css';
import "./styles/modal.css";
import "./styles/homepage.css";
import "./styles/MyplaylistPage.css"
import "./styles/PlaylistDetailPage.css"
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <App />
    </Router>
  </StrictMode>,
);
