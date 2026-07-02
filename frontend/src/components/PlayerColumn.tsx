import React from 'react';
import { Player, CRICKET_NUMBERS, CRICKET_NUMBER_LABELS } from '../types';

interface PlayerColumnProps {
  player: Player;
  isSelected: boolean;
  onSelect: () => void;
  isDisabled: boolean;
  isCurrentTurn?: boolean;
  onNumberClick?: (number: number) => void;
  // totalHits maps target numbers to the sum of hit multipliers (e.g., triple => 3)
  totalHits?: Record<number, number>;
}

const PlayerColumn: React.FC<PlayerColumnProps> = ({ player, isSelected, onSelect, isDisabled, isCurrentTurn, onNumberClick, totalHits }) => {
  return (
    <div
      onClick={onSelect}
      className={`scoreboard-column card transition-all transform ${isCurrentTurn ? 'ring-4 ring-green-400 scale-102 cursor-pointer' : 'cursor-default'} ${isSelected ? 'ring-4 ring-yellow-400 scale-105' : isCurrentTurn ? 'hover:scale-102' : ''} ${isDisabled ? 'opacity-75' : ''}`}
    >
      <div className="player-header w-full">
        <div className="flex items-center gap-3">
          <div className="number-badge text-xl">{player.playerNumber}</div>
          <div>
            <h3 className="text-2xl font-bold">{player.name}</h3>
            <div className="text-sm text-gray-300">{player.allClosed ? 'Closed' : 'Open'}</div>
          </div>
        </div>
        <div className="text-3xl font-extrabold text-yellow-400">{player.score}</div>
      </div>

      <div className="w-full mt-2">
        {CRICKET_NUMBERS.map(number => {
          const hits = player.hitCounts[number] || 0; // capped visual count (0-3)
          const total = totalHits ? (totalHits[number] || 0) : 0; // sum of multipliers for this target
          const isClickable = !isDisabled && !!isCurrentTurn;

          return (
            <div
              key={number}
              className={`dart-number mb-2 ${isClickable ? 'cursor-pointer hover:bg-gray-700 transition-colors rounded px-2 py-1' : ''}`}
              onClick={() => isClickable && onNumberClick?.(number)}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="number-badge">{CRICKET_NUMBER_LABELS[number]}</div>
                  <div className="flex gap-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`hit-dot ${i <= Math.min(hits, 3) ? 'filled' : ''}`}></div>
                    ))}
                  </div>
                </div>

                {/* Show total raw hits as a number on the right (sum of S/D/T values) */}
                <div className="w-8 text-right font-bold text-yellow-300">{total}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlayerColumn;
