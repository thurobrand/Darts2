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

const CricketMark: React.FC<{ hits: number }> = ({ hits }) => {
  const cappedHits = Math.min(Math.max(hits, 0), 3);

  return (
    <div className="w-9 h-9 flex items-center justify-center" aria-label={`${cappedHits} cricket marks`}>
      <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
        {cappedHits >= 1 && (
          <line x1="8" y1="24" x2="24" y2="8" className="stroke-orange-300" strokeWidth="3" strokeLinecap="round" />
        )}
        {cappedHits >= 2 && (
          <line x1="8" y1="8" x2="24" y2="24" className="stroke-orange-300" strokeWidth="3" strokeLinecap="round" />
        )}
        {cappedHits >= 3 && (
          <circle cx="16" cy="16" r="11" className="stroke-orange-300" strokeWidth="2.5" />
        )}
      </svg>
    </div>
  );
};

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
                  <CricketMark hits={hits} />
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
