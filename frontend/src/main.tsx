import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { GameProvider } from './context/GameContext';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GameProvider>
      <App />
    </GameProvider>
  </React.StrictMode>,
);
