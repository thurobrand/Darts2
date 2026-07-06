import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import setupBackground from '../thurcricketbg2.jpeg';

const DEFAULT_PLAYER_NAMES = ['Brian', 'Donny', 'Ross', 'Jonathan'];

const GameSetup: React.FC = () => {
  const { createGame, loading, error, savedPlayerNames, gameHistory, addSavedPlayerName } = useGame();
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState([
    savedPlayerNames[0] || 'Player 1',
    savedPlayerNames[1] || 'Player 2',
  ]);

  useEffect(() => {
    if (savedPlayerNames.length === 0) {
      return;
    }

    const allDefaults = playerNames.every((name, index) => name === `Player ${index + 1}`);
    if (allDefaults) {
      setPlayerNames(prev => prev.map((_, index) => savedPlayerNames[index] || `Player ${index + 1}`));
    }
  }, [savedPlayerNames]);

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

  const playerNameOptions = Array.from(
    new Set([
      ...DEFAULT_PLAYER_NAMES,
      ...savedPlayerNames,
      ...playerNames.map(name => name.trim()).filter(Boolean),
    ])
  );

  const handlePlayerNameSelect = (index: number, selectedName: string) => {
    if (!selectedName) {
      return;
    }
    handlePlayerNameChange(index, selectedName);
    addSavedPlayerName(selectedName);
  };

  const handlePlayerNameBlur = (index: number) => {
    const typedName = playerNames[index];
    addSavedPlayerName(typedName);
  };

  const handleStartGame = async () => {
    if (playerNames.some(name => !name.trim())) {
      alert('Please enter names for all players');
      return;
    }
    await createGame(playerNames);
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
                  <div key={index} className="grid grid-cols-[1fr_auto] gap-2">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                      onBlur={() => handlePlayerNameBlur(index)}
                      className="w-full rounded border border-slate-500 bg-slate-800/80 px-4 py-2 text-white"
                      placeholder={`Player ${index + 1}`}
                    />
                    <select
                      value=""
                      onChange={(e) => handlePlayerNameSelect(index, e.target.value)}
                      className="min-w-[8.5rem] rounded border border-slate-500 bg-slate-800/80 px-3 py-2 text-sm text-slate-100"
                      aria-label={`Select saved player name for player ${index + 1}`}
                    >
                      <option value="">Choose...</option>
                      {playerNameOptions.map((optionName) => (
                        <option key={`${index}-${optionName}`} value={optionName}>
                          {optionName}
                        </option>
                      ))}
                    </select>
                  </div>
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

            {gameHistory.length > 0 && (
              <div className="mt-6 rounded-xl border border-white/15 bg-black/25 p-3 text-slate-100">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">Recent games</div>
                <div className="mt-2 max-h-28 space-y-2 overflow-y-auto pr-1 text-xs">
                  {gameHistory.slice(0, 5).map((entry) => {
                    const winner = entry.players.find(player => player.id === entry.winnerId);
                    return (
                      <div key={entry.completedAt} className="rounded bg-white/10 px-2 py-1">
                        <div className="text-slate-300">
                          Winner: {winner?.name || 'n/a'} • {new Date(entry.completedAt).toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameSetup;
