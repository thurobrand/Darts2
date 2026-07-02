import React from 'react';
import { useGame } from './context/GameContext';
import GameSetup from './components/GameSetup';
import Scoreboard from './components/Scoreboard';

const App: React.FC = () => {
  const { gameState } = useGame();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">🎯 Cricket Darts Scorer</h1>
        
        {!gameState ? (
          <GameSetup />
        ) : (
          <Scoreboard />
        )}
      </div>
    </div>
  );
};

export default App;
