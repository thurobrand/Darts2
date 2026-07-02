import React, { useState } from 'react';
import { useGame } from '../context/GameContext';

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
    <div className="bg-gray-800 rounded-lg p-8 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6">Setup New Game</h2>

      {error && (
        <div className="bg-red-600 text-white p-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      {/* Session Name */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">Session Name</label>
        <input
          type="text"
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
          placeholder="Enter game name"
        />
      </div>

      {/* Player Count */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">Number of Players</label>
        <div className="flex gap-2">
          {[2, 3, 4].map(count => (
            <button
              key={count}
              onClick={() => handlePlayerCountChange(count)}
              className={`flex-1 py-2 px-3 rounded font-semibold transition-colors ${
                playerCount === count
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      {/* Player Names */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">Player Names</label>
        <div className="space-y-2">
          {playerNames.map((name, index) => (
            <input
              key={index}
              type="text"
              value={name}
              onChange={(e) => handlePlayerNameChange(index, e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              placeholder={`Player ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={handleStartGame}
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white font-bold py-3 rounded transition-colors"
      >
        {loading ? 'Starting...' : 'Start Game'}
      </button>
    </div>
  );
};

export default GameSetup;
