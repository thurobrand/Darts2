import React from 'react';
import { Player, CRICKET_NUMBER_LABELS } from '../types';

interface DartBoardGridProps {
  players: Player[];
  className?: string;
}

const ICON_FOR_HITS: Record<number, string> = {
  0: '',
  1: '/',
  2: 'X',
  3: 'Ⓧ',
};

const ORDERED_NUMBERS = [20, 19, 18, 17, 16, 15, 25];

const DartBoardGrid: React.FC<DartBoardGridProps> = ({ players, className = '' }) => {
  return (
    <div className={`overflow-auto ${className}`}>
      <table className="min-w-full table-auto border-collapse">
        <thead>
          <tr>
            <th className="px-3 py-2 text-left text-sm text-gray-300">Number</th>
            {players.map((p) => (
              <th key={p.id} className="px-4 py-2 text-center text-sm text-gray-200">
                <div className="font-semibold">{p.name}</div>
                <div className="text-xs text-yellow-400">{p.score} pts</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ORDERED_NUMBERS.map((num) => (
            <tr key={num} className="odd:bg-gray-800 even:bg-gray-700">
              <td className="px-3 py-2 text-left font-medium">{CRICKET_NUMBER_LABELS[num]}</td>
              {players.map((p) => {
                const hits = p.hitCounts[num] || 0;
                const icon = ICON_FOR_HITS[hits] || '';
                const closed = hits >= 3;

                return (
                  <td key={p.id + '-' + num} className="px-4 py-2 text-center align-middle">
                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${closed ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-200'}`}>
                      <span className="text-lg font-bold">{icon}</span>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DartBoardGrid;
