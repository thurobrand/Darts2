import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import PlayerColumn from './PlayerColumn';
import HitSelector from './HitSelector';
import WinnerPopup from './WinnerPopup';

interface ScoringEvent {
  playerId: number;
  playerName: string;
  targetNumber: number;
  hitValue: number;
  previousScore: number;
  previousHits: number;
  timestamp: number;
}

const Scoreboard: React.FC = () => {
  const { gameState, loading, recordHit, recordMiss, resetGame, removeHit } = useGame();
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [hitSelectorTarget, setHitSelectorTarget] = useState<{ number: number; playerId: number } | null>(null);
  const [previousState, setPreviousState] = useState<{ score: number; hits: number } | null>(null);
  const [scoringHistory, setScoringHistory] = useState<ScoringEvent[]>([]);

  if (!gameState) {
    return <div className="text-center">Loading game...</div>;
  }

  const isGameOver = gameState.status === 'COMPLETED';
  const winner = gameState.winnerId ? gameState.players.find(p => p.id === gameState.winnerId) : null;
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const dartsRemaining = 3 - gameState.dartsThisRound;

  // Auto-focus on current player's scorecard when turn changes
  useEffect(() => {
    if (currentPlayer) {
      setSelectedPlayerId(currentPlayer.id);
    }
  }, [gameState.currentPlayerIndex]);

  const handleNumberClick = (number: number, playerId: number) => {
    if (isGameOver) return;

    // Only the active player can score during their turn.
    if (playerId !== currentPlayer?.id) {
      return;
    }

    // Always update selected player when clicking a number
    setSelectedPlayerId(playerId);

    // Capture the player's current state for potential undo BEFORE opening the selector
    const clickedPlayer = gameState.players.find(p => p.id === playerId);
    if (clickedPlayer) {
      setPreviousState({ score: clickedPlayer.score, hits: clickedPlayer.hitCounts[number] || 0 });
      console.log('Captured previous state for player', playerId, { score: clickedPlayer.score, hits: clickedPlayer.hitCounts[number] || 0 });
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
    console.log('Undo button clicked');
    if (scoringHistory.length === 0 || !gameState) return;

    let lastEvent: ScoringEvent | null = null;
    try {
      // Close any open selector so clicks are not swallowed by a backdrop
      if (hitSelectorTarget) {
        setHitSelectorTarget(null);
      }

      // Get the last scoring event
      lastEvent = scoringHistory[scoringHistory.length - 1];
      console.log('Undoing score:', lastEvent);

      // Remove from history immediately for UI feedback
      setScoringHistory(prev => prev.slice(0, -1));

      if (currentPlayer?.id !== lastEvent.playerId) {
        throw new Error('Undo is only available during the current player turn.');
      }

      // Undo that score
      console.log('Calling removeHit with:', {
        gameSessionId: gameState.gameSessionId,
        playerId: lastEvent.playerId,
        targetNumber: lastEvent.targetNumber,
        previousScore: lastEvent.previousScore,
        previousHits: lastEvent.previousHits,
      });

      await removeHit(
        gameState.gameSessionId,
        lastEvent.playerId,
        lastEvent.targetNumber,
        lastEvent.previousScore,
        lastEvent.previousHits
      );
    } catch (error) {
      console.error('Failed to undo score:', error);
      // Add the event back to history if undo failed
      if (lastEvent) setScoringHistory(prev => [...prev, lastEvent!]);
    }
  };

  const handleHit = async (hitValue: number) => {
    if (!hitSelectorTarget || !gameState) return;

    try {
      const targetPlayer = gameState.players.find(p => p.id === hitSelectorTarget.playerId);
      
      // Store the current state before recording the hit (for undo)
      if (targetPlayer) {
        // Add to scoring history BEFORE the hit is recorded
        setScoringHistory(prev => [...prev, {
          playerId: hitSelectorTarget.playerId,
          playerName: targetPlayer.name,
          targetNumber: hitSelectorTarget.number,
          hitValue,
          previousScore: targetPlayer.score,
          previousHits: targetPlayer.hitCounts[hitSelectorTarget.number] || 0,
          timestamp: Date.now(),
        }]);
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
      await recordMiss(gameState.gameSessionId, currentPlayer.id);
      setHitSelectorTarget(null);
    } catch (error) {
      console.error('Failed to record miss:', error);
    }
  };


  const columns = Math.min(gameState.players.length, 4);
  // If a hit selector target is active, look up the player directly so we can
  // show the hit selector without waiting for currentPlayer to update.
  const targetPlayer = hitSelectorTarget ? gameState.players.find(p => p.id === hitSelectorTarget.playerId) : null;
  
  // Show the UI-selected player, or fall back to server's current player
  const scoringPlayer = selectedPlayerId 
    ? gameState.players.find(p => p.id === selectedPlayerId) 
    : currentPlayer;

  // Compute total raw hits (sum of hit multipliers) per player per target number from the scoring history
  const totalHitsByPlayer: Record<number, Record<number, number>> = React.useMemo(() => {
    return scoringHistory.reduce((acc, ev) => {
      acc[ev.playerId] = acc[ev.playerId] || {};
      acc[ev.playerId][ev.targetNumber] = (acc[ev.playerId][ev.targetNumber] || 0) + ev.hitValue;
      return acc;
    }, {} as Record<number, Record<number, number>>);
  }, [scoringHistory]);
  return (
    <div className="space-y-6">
      {/* Game Header */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold">{gameState.sessionName}</h2>
              {scoringPlayer && (
                <div className="text-lg font-semibold text-green-400 mt-2">
                  📍 Now Scoring: <span className="text-yellow-300">{scoringPlayer.name}</span>
                </div>
              )}
              {!isGameOver && (
                <div className="text-sm text-gray-300 mt-1">
                  Darts this turn: {gameState.dartsThisRound}/3 • Remaining: {dartsRemaining}
                </div>
              )}
            </div>
          </div>
          <span className={`text-lg font-semibold ${isGameOver ? 'text-green-400' : 'text-blue-400'}`}>
            {isGameOver ? '✓ COMPLETED' : 'IN PROGRESS'}
          </span>
        </div>
        
        {isGameOver && winner && (
          <div className="text-lg font-bold text-yellow-400">🏆 Winner: {winner.name}</div>
        )}

        {!isGameOver && currentPlayer && (
          <div className="mt-4">
            <button
              onClick={handleMiss}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Record Miss
            </button>
          </div>
        )}
      </div>

      {/* Players Grid */}

      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {gameState.players.map(player => (
          <PlayerColumn
            key={player.id}
            player={player}
            totalHits={totalHitsByPlayer[player.id] || {}}
            isSelected={selectedPlayerId === player.id}
            onSelect={async () => {
              if (player.id === currentPlayer?.id) {
                setSelectedPlayerId(player.id);
              }
            }}
            isDisabled={isGameOver}
            isCurrentTurn={player.id === currentPlayer?.id}
            onNumberClick={(number) => handleNumberClick(number, player.id)}
          />
        ))}
      </div>

      {/* Hit Selector Popup */}
      {hitSelectorTarget && targetPlayer && (
        <HitSelector
          number={hitSelectorTarget.number}
          playerName={targetPlayer.name}
          currentHits={targetPlayer.hitCounts[hitSelectorTarget.number] || 0}
          onHit={handleHit}
          onMiss={handleMiss}
          onRemoveHit={handleRemoveHit}
          onClose={() => setHitSelectorTarget(null)}
          loading={loading}
        />
      )}

      {/* Winner Popup */}
      {isGameOver && winner && (
        <WinnerPopup
          winner={winner}
          players={gameState.players}
          onClose={resetGame}
        />
      )}

      {/* Scoring History */}
      {!isGameOver && scoringHistory.length > 0 && (
        <div className="mt-6 bg-gray-800 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold">Scoring History</h3>
            <button
              onClick={handleUndoLastScore}
              disabled={loading || !!hitSelectorTarget}
              title={hitSelectorTarget ? 'Close the hit selector before undoing' : ''}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ↶ Undo Last Score
            </button>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {[...scoringHistory].reverse().slice(0, 10).map((event) => (
              <div key={event.timestamp} className="flex items-center gap-3 bg-gray-700 p-2 rounded text-sm">
                <span className="text-yellow-400 font-semibold">{event.playerName}</span>
                <span className="text-gray-400">hit</span>
                <span className="text-blue-400 font-bold">{event.targetNumber}</span>
                <span className="text-gray-400">({event.hitValue === 1 ? 'S' : event.hitValue === 2 ? 'D' : 'T'})</span>
                <span className="text-green-400 ml-auto">+{event.targetNumber * event.hitValue}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Scoreboard;
