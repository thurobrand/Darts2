import React from 'react';
import { useGame } from './context/GameContext';
import GameSetup from './components/GameSetup';
import Scoreboard from './components/Scoreboard';

const App: React.FC = () => {
  const { gameState } = useGame();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.95),_rgba(2,6,23,1)_70%)] px-4 py-6 text-white sm:py-8">
      <div className="mx-auto max-w-7xl">
        {!gameState ? <GameSetup /> : <Scoreboard />}
      </div>
    </div>
  );
};

export default App;
