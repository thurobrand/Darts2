import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { CRICKET_NUMBERS, CRICKET_NUMBER_LABELS } from '../types';

interface KeypadProps {
  playerId: number;
  gameSessionId: number;
  loading: boolean;
  dartsRemaining?: number;
}

const Keypad: React.FC<KeypadProps> = ({ playerId, gameSessionId, loading, dartsRemaining = 3 }) => {
  const { recordHit, recordMiss, skipToNextPlayer, error } = useGame();
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const isBullSelected = selectedNumber === 25;

  const handleNumberClick = (number: number) => {
    setSelectedNumber(selectedNumber === number ? null : number);
  };

  const handleHitSubmit = async (hitValue: 1 | 2 | 3) => {
    if (!selectedNumber) {
      alert('Please select a number');
      return;
    }

    await recordHit(gameSessionId, playerId, selectedNumber, hitValue);
    setSelectedNumber(null);
  };

  const handleMiss = async () => {
    await recordMiss(gameSessionId, playerId);
    setSelectedNumber(null);
  };

  const handleSkip = async () => {
    await skipToNextPlayer(gameSessionId, playerId);
    setSelectedNumber(null);
  };

  return (
    <div className="card p-6 max-w-2xl mx-auto">
      <h3 className="text-2xl font-bold mb-4">Enter Score</h3>

      {error && (
        <div className="bg-red-600 text-white p-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      {/* Cricket Numbers as circular keys */}
      <div className="flex flex-wrap gap-4 justify-center mb-6">
        {CRICKET_NUMBERS.map(number => (
          <button
            key={number}
            onClick={() => handleNumberClick(number)}
            disabled={loading}
            className={`key-circle ${selectedNumber === number ? 'selected' : ''} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {CRICKET_NUMBER_LABELS[number]}
          </button>
        ))}
      </div>

      {/* Hit Value Buttons styled like dartboard rings */}
      <div className="text-center">
        <p className="text-gray-400 mb-3">Select hit value:</p>
        <div className="flex gap-6 justify-center mb-4">
          <button
            onClick={() => handleHitSubmit(1)}
            disabled={!selectedNumber || loading}
            className={`hit-action primary disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Single
          </button>
          <button
            onClick={() => handleHitSubmit(2)}
            disabled={!selectedNumber || loading}
            className={`hit-action bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Double
          </button>
          <button
            onClick={() => handleHitSubmit(3)}
            disabled={!selectedNumber || loading || isBullSelected}
            className={`hit-action triple disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Triple
          </button>
        </div>

        {/* Miss and Skip buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleMiss}
            disabled={loading}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Miss
          </button>
          {dartsRemaining > 0 && (
            <button
              onClick={handleSkip}
              disabled={loading}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next Player
            </button>
          )}
        </div>
      </div>

      {selectedNumber && (
        <p className="text-center mt-4 text-yellow-400 font-semibold">
          Selected: {CRICKET_NUMBER_LABELS[selectedNumber]}
        </p>
      )}
    </div>
  );
};

export default Keypad;
