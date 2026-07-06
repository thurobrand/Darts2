import React, { useState } from 'react';
import { useGame } from './context/GameContext';
import GameSetup from './components/GameSetup';
import Scoreboard from './components/Scoreboard';
import SplashScreen from './components/SplashScreen';

const App: React.FC = () => {
  const { gameState } = useGame();
  const [showSplash, setShowSplash] = useState(true);

  const shouldShowSplash = !gameState && showSplash;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.95),_rgba(2,6,23,1)_70%)] px-4 py-6 text-white sm:py-8">
      <div className="mx-auto max-w-7xl">
        {shouldShowSplash ? (
          <SplashScreen onContinue={() => setShowSplash(false)} />
        ) : !gameState ? (
          <GameSetup />
        ) : (
          <Scoreboard onResetToSplash={() => setShowSplash(true)} />
        )}
      </div>
    </div>
  );
};

export default App;
