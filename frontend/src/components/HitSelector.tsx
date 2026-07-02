import React from 'react';

interface HitSelectorProps {
  number: number;
  playerName: string;
  currentHits: number;
  onHit: (hitValue: number) => void;
  onMiss: () => void;
  onRemoveHit: () => void;
  onClose: () => void;
  loading: boolean;
}

const HitSelector: React.FC<HitSelectorProps> = ({ number, playerName, currentHits, onHit, onMiss, onRemoveHit, onClose, loading }) => {
  const hitOptions = number === 25 ? [1, 2] : [1, 2, 3];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Popup */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
        <div className="bg-gray-800 border-2 border-yellow-400 rounded-lg p-6 max-w-sm w-80 shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-2">{playerName}</h3>
          <p className="text-2xl font-bold text-yellow-400 mb-4">Target: {number}</p>

          <p className="text-sm text-gray-300 mb-4">Select hit type:</p>

          <div className="flex gap-3 justify-center">
            {hitOptions.map(hitValue => (
              <button
                key={hitValue}
                onClick={() => onHit(hitValue)}
                disabled={loading}
                className="w-16 h-16 rounded-full font-bold text-lg transition-all transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: hitValue === 1 ? '#10b981' : hitValue === 2 ? '#f59e0b' : '#ef4444',
                  color: 'white',
                }}
              >
                {hitValue === 1 ? 'S' : hitValue === 2 ? 'D' : 'T'}
              </button>
            ))}
          </div>

          <div className={`grid gap-3 mt-4 text-xs text-gray-400 text-center ${hitOptions.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            <div>Single</div>
            <div>Double</div>
            {hitOptions.length === 3 && <div>Triple</div>}
          </div>

          <button
            onClick={onMiss}
            disabled={loading}
            className="w-full mt-4 py-2 px-4 bg-gray-600 hover:bg-gray-500 text-white rounded font-semibold transition-all disabled:opacity-50"
          >
            Miss (No Score)
          </button>

          {currentHits > 0 && (
            <button
              onClick={onRemoveHit}
              disabled={loading}
              className="w-full mt-4 py-2 px-4 bg-red-600 hover:bg-red-500 text-white rounded font-semibold transition-all disabled:opacity-50"
            >
              Undo Previous Score ({currentHits})
            </button>
          )}

          <button
            onClick={onClose}
            disabled={loading}
            className="mt-4 w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded transition-all disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
};

export default HitSelector;
