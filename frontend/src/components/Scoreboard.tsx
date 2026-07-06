import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import HitSelector from './HitSelector';
import WinnerPopup from './WinnerPopup';
import { CRICKET_NUMBER_LABELS, Player } from '../types';

interface ScoringEvent {
  playerId: number;
  playerName: string;
  targetNumber: number;
  hitValue: number;
  previousScore: number;
  previousHits: number;
  timestamp: number;
}

const DISPLAY_NUMBERS = [20, 19, 18, 17, 16, 15, 25];

const formatPlayerNumber = (playerNumber: number) => String(playerNumber).padStart(2, '0');

const CricketMark: React.FC<{ hits: number; active?: boolean }> = ({ hits, active = false }) => {
  const cappedHits = Math.min(Math.max(hits, 0), 3);
  const strokeClass = active ? 'stroke-emerald-700' : 'stroke-stone-800';

  return (
    <div className="flex h-8 w-8 items-center justify-center sm:h-10 sm:w-10" aria-label={`${cappedHits} cricket marks`}>
      <svg viewBox="0 0 32 32" className="h-7 w-7 sm:h-8 sm:w-8" fill="none" xmlns="http://www.w3.org/2000/svg">
        {cappedHits >= 1 && (
          <line x1="8" y1="24" x2="24" y2="8" className={strokeClass} strokeWidth="3" strokeLinecap="round" />
        )}
        {cappedHits >= 2 && (
          <line x1="8" y1="8" x2="24" y2="24" className={strokeClass} strokeWidth="3" strokeLinecap="round" />
        )}
        {cappedHits >= 3 && <circle cx="16" cy="16" r="11" className={strokeClass} strokeWidth="2.5" />}
      </svg>
    </div>
  );
};

const PlayerHeaderCell: React.FC<{
  player: Player;
  isCurrentTurn: boolean;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ player, isCurrentTurn, isSelected, onSelect }) => {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex min-h-[clamp(52px,8.5vh,92px)] w-full flex-col items-center justify-center gap-1 px-1 py-1.5 text-center transition-colors focus:outline-none sm:px-3 sm:py-2 ${
        isCurrentTurn ? 'bg-emerald-100' : 'bg-white/80'
      } ${isSelected ? 'ring-2 ring-inset ring-yellow-400' : ''}`}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-stone-400 bg-stone-100 text-[10px] font-semibold tracking-[0.12em] text-stone-700 sm:h-9 sm:w-9 sm:text-xs sm:tracking-[0.18em]">
        {formatPlayerNumber(player.playerNumber)}
      </span>
      <span className="max-w-full truncate px-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-stone-700 sm:text-xs sm:tracking-[0.18em]">
        {player.name}
      </span>
    </button>
  );
};

const PlayerScoreCell: React.FC<{
  hits: number;
  isCurrentTurn: boolean;
  isClickable: boolean;
  onClick: () => void;
}> = ({ hits, isCurrentTurn, isClickable, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isClickable}
      className={`flex min-h-[clamp(58px,9.5vh,104px)] w-full items-center justify-center px-1 py-1.5 transition-colors focus:outline-none sm:px-3 sm:py-3 ${
        isCurrentTurn ? 'bg-emerald-100/90' : 'bg-white/80'
      } ${isClickable ? 'cursor-pointer hover:bg-amber-50' : 'cursor-default'} disabled:opacity-100`}
    >
      <CricketMark hits={hits} active={isCurrentTurn} />
    </button>
  );
};

const PlayerTotalCell: React.FC<{
  score: number;
  isCurrentTurn: boolean;
}> = ({ score, isCurrentTurn }) => {
  return (
    <div
      className={`flex min-h-[clamp(46px,7.2vh,82px)] w-full items-center justify-center border-t border-stone-400 px-1 py-1.5 font-serif text-xl font-black tracking-wide sm:px-3 sm:py-2 sm:text-3xl ${
        isCurrentTurn ? 'bg-emerald-100 text-stone-900' : 'bg-white/90 text-stone-900'
      }`}
    >
      {score}
    </div>
  );
};

interface ScoreboardProps {
  onResetToSplash?: () => void;
}

const Scoreboard: React.FC<ScoreboardProps> = ({ onResetToSplash }) => {
  const { gameState, loading, recordHit, recordMiss, resetGame, removeHit } = useGame();
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [hitSelectorTarget, setHitSelectorTarget] = useState<{ number: number; playerId: number } | null>(null);
  const [previousState, setPreviousState] = useState<{ score: number; hits: number } | null>(null);
  const [scoringHistory, setScoringHistory] = useState<ScoringEvent[]>([]);

  const players = gameState?.players ?? [];
  const currentPlayer = gameState ? players[gameState.currentPlayerIndex] : null;
  const isGameOver = gameState?.status === 'COMPLETED';
  const winner = gameState?.winnerId ? players.find(p => p.id === gameState.winnerId) : null;
  const dartsRemaining = gameState ? 3 - gameState.dartsThisRound : 0;
  const midpoint = Math.ceil(players.length / 2);
  const leftPlayers = players.slice(0, midpoint);
  const rightPlayers = players.slice(midpoint);
  const sheetGridTemplate = `${leftPlayers.map(() => 'minmax(0, 1fr)').join(' ')}${leftPlayers.length ? ' ' : ''}minmax(7.5rem, 9rem)${rightPlayers.length ? ' ' + rightPlayers.map(() => 'minmax(0, 1fr)').join(' ') : ''}`;

  const scoringPlayer = selectedPlayerId ? players.find(p => p.id === selectedPlayerId) : currentPlayer;

  useEffect(() => {
    if (currentPlayer) {
      setSelectedPlayerId(currentPlayer.id);
    }
  }, [currentPlayer?.id]);

  if (!gameState) {
    return <div className="flex min-h-[60vh] items-center justify-center text-center text-lg text-slate-300">Loading game...</div>;
  }

  const handleNumberClick = (number: number, playerId: number) => {
    if (isGameOver) return;

    if (playerId !== currentPlayer?.id) {
      return;
    }

    setSelectedPlayerId(playerId);

    const clickedPlayer = gameState.players.find(p => p.id === playerId);
    if (clickedPlayer) {
      setPreviousState({ score: clickedPlayer.score, hits: clickedPlayer.hitCounts[number] || 0 });
    }

    setHitSelectorTarget({ number, playerId });
  };

  const handleRemoveHit = async () => {
    if (!hitSelectorTarget || !gameState || !previousState) return;

    try {
      await removeHit(
        gameState.gameSessionId,
        hitSelectorTarget.playerId,
        hitSelectorTarget.number,
        previousState.score,
        previousState.hits
      );
      setHitSelectorTarget(null);
      setPreviousState(null);
    } catch (error) {
      console.error('Failed to remove hit:', error);
    }
  };

  const handleUndoLastScore = async () => {
    if (scoringHistory.length === 0 || !gameState) return;

    let lastEvent: ScoringEvent | null = null;
    try {
      if (hitSelectorTarget) {
        setHitSelectorTarget(null);
      }

      lastEvent = scoringHistory[scoringHistory.length - 1];
      setScoringHistory(prev => prev.slice(0, -1));

      if (currentPlayer?.id !== lastEvent.playerId) {
        throw new Error('Undo is only available during the current player turn.');
      }

      await removeHit(
        gameState.gameSessionId,
        lastEvent.playerId,
        lastEvent.targetNumber,
        lastEvent.previousScore,
        lastEvent.previousHits
      );
    } catch (error) {
      console.error('Failed to undo score:', error);
      if (lastEvent) setScoringHistory(prev => [...prev, lastEvent!]);
    }
  };

  const handleHit = async (hitValue: number) => {
    if (!hitSelectorTarget || !gameState) return;

    try {
      const targetPlayer = gameState.players.find(p => p.id === hitSelectorTarget.playerId);

      if (targetPlayer) {
        setScoringHistory(prev => [
          ...prev,
          {
            playerId: hitSelectorTarget.playerId,
            playerName: targetPlayer.name,
            targetNumber: hitSelectorTarget.number,
            hitValue,
            previousScore: targetPlayer.score,
            previousHits: targetPlayer.hitCounts[hitSelectorTarget.number] || 0,
            timestamp: Date.now(),
          },
        ]);
      }

      await recordHit(gameState.gameSessionId, hitSelectorTarget.playerId, hitSelectorTarget.number, hitValue);
      setHitSelectorTarget(null);
    } catch (error) {
      console.error('Failed to record hit:', error);
    }
  };

  const handleMiss = async () => {
    if (!gameState || !currentPlayer || isGameOver) return;

    try {
      const remainingDarts = 3 - gameState.dartsThisRound;

      for (let dartIndex = 0; dartIndex < remainingDarts; dartIndex += 1) {
        await recordMiss(gameState.gameSessionId, currentPlayer.id);
      }

      setHitSelectorTarget(null);
    } catch (error) {
      console.error('Failed to record miss:', error);
    }
  };

  const handleResetGame = () => {
    setSelectedPlayerId(null);
    setHitSelectorTarget(null);
    setPreviousState(null);
    setScoringHistory([]);
    resetGame();
    onResetToSplash?.();
  };

  const targetPlayer = hitSelectorTarget ? gameState.players.find(p => p.id === hitSelectorTarget.playerId) : null;

  const renderPlayerHeader = (player: Player) => (
    <PlayerHeaderCell
      key={player.id}
      player={player}
      isSelected={selectedPlayerId === player.id}
      isCurrentTurn={player.id === currentPlayer?.id}
      onSelect={() => {
        if (player.id === currentPlayer?.id) {
          setSelectedPlayerId(player.id);
        }
      }}
    />
  );

  const renderPlayerCell = (player: Player, number: number) => {
    const isCurrentTurn = player.id === currentPlayer?.id;

    return (
      <PlayerScoreCell
        key={`${player.id}-${number}`}
        hits={player.hitCounts[number] || 0}
        isCurrentTurn={isCurrentTurn}
        isClickable={!isGameOver && isCurrentTurn}
        onClick={() => handleNumberClick(number, player.id)}
      />
    );
  };

  return (
    <div className="space-y-4">
      <div className="sticky top-2 z-40">
        <div className="flex flex-wrap items-center justify-between gap-1.5 rounded-xl border border-stone-300 bg-white/95 px-2.5 py-1.5 shadow-md backdrop-blur">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600">Turn controls</div>
          {!isGameOver && currentPlayer && (
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={handleMiss}
                disabled={loading}
                className="rounded-full bg-stone-700 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-white transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next Player (Miss)
              </button>
              <button
                onClick={handleUndoLastScore}
                disabled={loading || scoringHistory.length === 0 || !!hitSelectorTarget}
                title={hitSelectorTarget ? 'Close the hit selector before undoing' : ''}
                className="rounded-full bg-rose-600 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-white transition-colors hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Undo last score
              </button>
              <button
                onClick={handleResetGame}
                className="rounded-full bg-stone-200 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-stone-800 transition-colors hover:bg-stone-300"
              >
                Reset
              </button>
            </div>
          )}
        </div>
      </div>

      <section className="overflow-hidden rounded-[2rem] border border-stone-300 bg-[#f7f2e8] text-stone-900 shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
        <div className="px-2 pb-3 pt-3 sm:px-4 md:px-6 md:pb-5 md:pt-5">
          <div className="text-center">

            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-stone-600 md:mt-3">
              {!isGameOver && scoringPlayer && (
                <span className="rounded-full border border-stone-300 bg-white/60 px-2.5 py-0.5 text-xs font-semibold tracking-[0.1em] text-stone-700">
                  Now scoring: {scoringPlayer.name}
                </span>
              )}
              {!isGameOver && (
                <span className="rounded-full border border-stone-300 bg-white/60 px-2.5 py-0.5 text-xs tracking-[0.1em] text-stone-700">
                  Darts this turn: {gameState.dartsThisRound}/3 • Remaining: {dartsRemaining}
                </span>
              )}
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-[0.12em] ${isGameOver ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'}`}>
                {isGameOver ? 'COMPLETED' : 'IN PROGRESS'}
              </span>
            </div>

            {isGameOver && winner && <div className="mt-2 text-base font-bold text-amber-700">Winner: {winner.name}</div>}
          </div>

          <div className="mt-3 w-full pb-1">
            <div className="w-full overflow-hidden rounded-[1.5rem] border border-stone-400 bg-white/70">
              <div className="grid border-b border-stone-400" style={{ gridTemplateColumns: sheetGridTemplate }}>
                {leftPlayers.map(renderPlayerHeader)}
                <div className="flex min-h-[clamp(52px,8.5vh,92px)] items-center justify-center border-l border-r border-stone-400 bg-white/60 px-1 py-1.5 text-center font-serif text-[10px] uppercase tracking-[0.22em] text-stone-500 sm:px-3 sm:py-2 sm:text-xs sm:tracking-[0.4em]">
                  Cricket
                </div>
                {rightPlayers.map(renderPlayerHeader)}
              </div>

              <div className="divide-y divide-stone-400">
                {DISPLAY_NUMBERS.map(number => (
                  <div key={number} className="grid" style={{ gridTemplateColumns: sheetGridTemplate }}>
                    {leftPlayers.map(player => renderPlayerCell(player, number))}

                    <div className="flex min-h-[clamp(58px,9.5vh,104px)] items-center justify-center border-l border-r border-stone-400 bg-white/80 px-1 py-1.5 font-serif text-2xl font-black tracking-wide text-stone-900 sm:px-3 sm:py-3 sm:text-4xl">
                      {CRICKET_NUMBER_LABELS[number] ?? number}
                    </div>

                    {rightPlayers.map(player => renderPlayerCell(player, number))}
                  </div>
                ))}

                <div className="grid" style={{ gridTemplateColumns: sheetGridTemplate }}>
                  {leftPlayers.map(player => (
                    <PlayerTotalCell
                      key={player.id}
                      score={player.score}
                      isCurrentTurn={player.id === currentPlayer?.id}
                    />
                  ))}

                  <div className="flex min-h-[clamp(46px,7.2vh,82px)] items-center justify-center border-l border-r border-stone-400 border-t border-stone-400 bg-white/95 px-1 py-1.5 text-center font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500 sm:px-3 sm:py-2 sm:text-[11px] sm:tracking-[0.35em]">
                    Score
                  </div>

                  {rightPlayers.map(player => (
                    <PlayerTotalCell
                      key={player.id}
                      score={player.score}
                      isCurrentTurn={player.id === currentPlayer?.id}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {hitSelectorTarget && targetPlayer && (
        <HitSelector
          number={hitSelectorTarget.number}
          playerName={targetPlayer.name}
          currentHits={targetPlayer.hitCounts[hitSelectorTarget.number] || 0}
          onHit={handleHit}
          onNext={handleMiss}
          onRemoveHit={handleRemoveHit}
          onClose={() => setHitSelectorTarget(null)}
          loading={loading}
        />
      )}

      {isGameOver && winner && <WinnerPopup winner={winner} players={gameState.players} onClose={handleResetGame} />}

      {!isGameOver && scoringHistory.length > 0 && (
        <details className="rounded-2xl border border-white/10 bg-white/5 p-4 text-slate-100">
          <summary className="cursor-pointer select-none text-sm uppercase tracking-[0.3em] text-slate-300">
            Scoring history
          </summary>
          <div className="mt-4 max-h-40 space-y-2 overflow-y-auto pr-1">
            {[...scoringHistory].reverse().slice(0, 10).map((event) => (
              <div key={event.timestamp} className="flex items-center gap-3 rounded-lg bg-white/5 p-2 text-sm">
                <span className="font-semibold text-amber-300">{event.playerName}</span>
                <span className="text-slate-400">hit</span>
                <span className="font-bold text-sky-300">{event.targetNumber}</span>
                <span className="text-slate-400">({event.hitValue === 1 ? 'S' : event.hitValue === 2 ? 'D' : 'T'})</span>
                <span className="ml-auto text-emerald-300">+{event.targetNumber * event.hitValue}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
};

export default Scoreboard;