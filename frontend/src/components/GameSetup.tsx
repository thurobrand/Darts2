import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import setupBackground from '../thurcricketbg2.jpeg';

const GameSetup: React.FC = () => {
  const { createGame, loading, error } = useGame();
  const [sessionName, setSessionName] = useState('Game 1');
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState(['Player 1', 'Player 2']);

  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count);
    const newNames = Array.from({ length: count }, (_, i) => playerNames[i] || `Player ${i + 1}`);
    setPlayerNames(newNames);
  };

  const handlePlayerNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const handleStartGame = async () => {
    if (playerNames.some(name => !name.trim())) {
      alert('Please enter names for all players');
      return;
    }
    await createGame(sessionName, playerNames);
  };

  return (
    <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-3xl border border-white/15 shadow-[0_30px_80px_rgba(2,6,23,0.65)]">
      <div className="relative min-h-[72vh]">
        <img
          src={setupBackground}
          alt="Cricket darts board background"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/55 to-black/70" />

        <div className="relative z-10 mx-auto flex min-h-[72vh] max-w-md items-center px-4 py-8 sm:px-6">
          <div className="w-full rounded-2xl border border-white/20 bg-slate-900/70 p-6 backdrop-blur-sm sm:p-8">
            <h2 className="mb-6 text-2xl font-bold text-white">Setup New Game</h2>

            {error && (
              <div className="mb-4 rounded bg-red-600 p-3 text-white">
                Error: {error}
              </div>
            )}

            {/* Session Name */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-semibold text-slate-100">Session Name</label>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                className="w-full rounded border border-slate-500 bg-slate-800/80 px-4 py-2 text-white"
                placeholder="Enter game name"
              />
            </div>

            {/* Player Count */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-semibold text-slate-100">Number of Players</label>
              <div className="flex gap-2">
                {[2, 3, 4].map(count => (
                  <button
                    key={count}
                    onClick={() => handlePlayerCountChange(count)}
                    className={`flex-1 rounded py-2 px-3 font-semibold transition-colors ${
                      playerCount === count
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700/90 text-slate-200 hover:bg-slate-600'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {/* Player Names */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-semibold text-slate-100">Player Names</label>
              <div className="space-y-2">
                {playerNames.map((name, index) => (
                  <input
                    key={index}
                    type="text"
                    value={name}
                    onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                    className="w-full rounded border border-slate-500 bg-slate-800/80 px-4 py-2 text-white"
                    placeholder={`Player ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartGame}
              disabled={loading}
              className="w-full rounded bg-green-600 py-3 font-bold text-white transition-colors hover:bg-green-700 disabled:bg-green-800"
            >
              {loading ? 'Starting...' : 'Start Game'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameSetup;
