import React from 'react';
import { Player } from '../types';

interface WinnerPopupProps {
  winner: Player;
  players: Player[];
  onClose: () => void;
}

const WinnerPopup: React.FC<WinnerPopupProps> = ({ winner, players, onClose }) => {
  // Sort players by score (highest first)
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-70 z-40 flex items-center justify-center"
        onClick={onClose}
      />

      {/* Popup */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
        <div className="bg-gray-900 border-4 border-yellow-400 rounded-lg p-8 max-w-md w-96 shadow-2xl">
          {/* Winner Section */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-3">🏆 WINNER! 🏆</h2>
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-300 bg-clip-text text-transparent text-3xl font-bold mb-2">
              {winner.name}
            </div>
            <div className="text-5xl font-extrabold text-yellow-400">{winner.score}</div>
            <div className="text-sm text-gray-400 mt-1">points</div>
          </div>

          {/* All Scores */}
          <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
            {sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                  player.id === winner.id
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-400 text-gray-900 font-bold scale-105'
                    : 'bg-gray-800 text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-2xl font-bold ${player.id === winner.id ? 'text-yellow-900' : 'text-gray-400'}`}>
                    #{index + 1}
                  </span>
                  <span className="text-lg font-semibold">{player.name}</span>
                </div>
                <span className={`text-2xl font-bold ${player.id === winner.id ? 'text-yellow-900' : 'text-yellow-400'}`}>
                  {player.score}
                </span>
              </div>
            ))}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white rounded-lg font-bold text-lg transition-all transform hover:scale-105"
          >
            Play Again
          </button>
        </div>
      </div>
    </>
  );
};

export default WinnerPopup;
