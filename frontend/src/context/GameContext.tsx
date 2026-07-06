/**
 * Game context for managing game state across the application
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { CRICKET_NUMBERS, GameHistoryEntry, GameState, Player } from '../types';

interface GameContextType {
  gameState: GameState | null;
  gameHistory: GameHistoryEntry[];
  savedPlayerNames: string[];
  loading: boolean;
  error: string | null;
  
  // Actions
  createGame: (playerNames: string[]) => Promise<void>;
  loadGame: (gameId: number) => Promise<void>;
  recordHit: (gameId: number, playerId: number, targetNumber: number, hitValue: number) => Promise<void>;
  recordMiss: (gameId: number, playerId: number) => Promise<void>;
  skipToNextPlayer: (gameId: number, playerId: number) => Promise<void>;
  resetGame: () => void;
  removeHit: (gameId: number, playerId: number, targetNumber: number, previousScore: number, previousHitCount: number) => Promise<void>;
  clearSavedPlayerNames: () => void;
  addSavedPlayerName: (name: string) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const STORAGE_KEYS = {
  activeGame: 'darts2.activeGame',
  history: 'darts2.gameHistory',
  players: 'darts2.savedPlayers',
};

const DEFAULT_PLAYER_NAMES = ['Brian', 'Donny', 'Ross', 'Jonathan'];

const normalizePlayerNames = (names: string[]): string[] => {
  const normalized = names.map(name => name.trim()).filter(Boolean);
  return Array.from(new Set(normalized));
};

const parseStoredValue = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const createEmptyHitCounts = (): Record<number, number> => {
  const hitCounts: Record<number, number> = {};
  for (const number of CRICKET_NUMBERS) {
    hitCounts[number] = 0;
  }
  return hitCounts;
};

const checkAllNumbersClosed = (player: Player): boolean => {
  return CRICKET_NUMBERS.every(number => (player.hitCounts[number] ?? 0) >= 3);
};

const isNumberClosedByAll = (players: Player[], targetNumber: number): boolean => {
  return players.every(player => (player.hitCounts[targetNumber] ?? 0) >= 3);
};

const evaluateWinner = (players: Player[]): number | undefined => {
  for (const candidate of players) {
    if (!checkAllNumbersClosed(candidate)) {
      continue;
    }

    const hasHighestOrTiedScore = players.every(other => other.id === candidate.id || other.score <= candidate.score);
    if (hasHighestOrTiedScore) {
      return candidate.id;
    }
  }

  return undefined;
};

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameHistory, setGameHistory] = useState<GameHistoryEntry[]>([]);
  const [savedPlayerNames, setSavedPlayerNames] = useState<string[]>(DEFAULT_PLAYER_NAMES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const restoredGame = parseStoredValue<GameState | null>(localStorage.getItem(STORAGE_KEYS.activeGame), null);
    const restoredHistory = parseStoredValue<GameHistoryEntry[]>(localStorage.getItem(STORAGE_KEYS.history), []);
    const restoredPlayers = parseStoredValue<string[]>(localStorage.getItem(STORAGE_KEYS.players), []);

    const namesFromHistory = restoredHistory.flatMap(entry => entry.players.map(player => player.name));
    const namesFromActiveGame = restoredGame?.players.map(player => player.name) ?? [];
    const mergedNames = normalizePlayerNames([
      ...DEFAULT_PLAYER_NAMES,
      ...restoredPlayers,
      ...namesFromHistory,
      ...namesFromActiveGame,
    ]);

    setGameState(restoredGame);
    setGameHistory(restoredHistory);
    setSavedPlayerNames(mergedNames);
  }, []);

  useEffect(() => {
    if (gameState) {
      localStorage.setItem(STORAGE_KEYS.activeGame, JSON.stringify(gameState));
    } else {
      localStorage.removeItem(STORAGE_KEYS.activeGame);
    }
  }, [gameState]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(gameHistory));
  }, [gameHistory]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.players, JSON.stringify(savedPlayerNames));
  }, [savedPlayerNames]);

  const setPlayerNameHistory = (playerNames: string[]) => {
    const uniqueNames = normalizePlayerNames(playerNames);
    setSavedPlayerNames(prev => {
      const mergedNames = [...uniqueNames, ...prev.filter(name => !uniqueNames.includes(name))];
      return mergedNames.slice(0, 50);
    });
  };

  const addSavedPlayerName = (name: string) => {
    const normalizedName = name.trim();
    if (!normalizedName) {
      return;
    }

    setSavedPlayerNames(prev => {
      if (prev.includes(normalizedName)) {
        return prev;
      }
      return [normalizedName, ...prev].slice(0, 50);
    });
  };

  const clearSavedPlayerNames = () => {
    setSavedPlayerNames(DEFAULT_PLAYER_NAMES);
  };

  const getNextSessionId = (): number => {
    const ids = [
      gameState?.gameSessionId,
      ...gameHistory.map(entry => entry.gameSessionId),
    ].filter((id): id is number => typeof id === 'number');

    if (ids.length === 0) {
      return Date.now();
    }

    return Math.max(...ids) + 1;
  };

  const validateGameAndCurrentPlayer = (currentState: GameState | null, gameId: number, playerId: number): Player => {
    if (!currentState || currentState.gameSessionId !== gameId) {
      throw new Error('Active game not found');
    }

    if (currentState.status === 'COMPLETED') {
      throw new Error('Game is already completed');
    }

    const expectedCurrentPlayer = currentState.players[currentState.currentPlayerIndex];
    if (!expectedCurrentPlayer || expectedCurrentPlayer.id !== playerId) {
      throw new Error('It is not this player\'s turn');
    }

    const selectedPlayer = currentState.players.find(player => player.id === playerId);
    if (!selectedPlayer) {
      throw new Error('Player not found');
    }

    return selectedPlayer;
  };

  const finalizeGameIfWon = (nextState: GameState) => {
    const winnerId = evaluateWinner(nextState.players);
    if (!winnerId) {
      return nextState;
    }

    const completedState: GameState = {
      ...nextState,
      status: 'COMPLETED',
      winnerId,
    };

    const historyEntry: GameHistoryEntry = {
      gameSessionId: completedState.gameSessionId,
      winnerId,
      players: completedState.players,
      completedAt: Date.now(),
    };

    setGameHistory(prev => {
      const withoutCurrent = prev.filter(entry => entry.gameSessionId !== completedState.gameSessionId);
      return [historyEntry, ...withoutCurrent].slice(0, 100);
    });

    return completedState;
  };

  const createGame = async (playerNames: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const normalizedNames = playerNames.map(name => name.trim()).filter(Boolean);
      if (normalizedNames.length < 2) {
        throw new Error('At least two players are required.');
      }

      const players: Player[] = normalizedNames.map((name, index) => ({
        id: index + 1,
        name,
        playerNumber: index + 1,
        hitCounts: createEmptyHitCounts(),
        score: 0,
        allClosed: false,
      }));

      const state: GameState = {
        gameSessionId: getNextSessionId(),
        status: 'IN_PROGRESS',
        players,
        currentPlayerIndex: 0,
        dartsThisRound: 0,
      };

      setPlayerNameHistory(normalizedNames);
      setGameState(state);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  const loadGame = async (gameId: number) => {
    setLoading(true);
    setError(null);
    try {
      const activeGame = parseStoredValue<GameState | null>(localStorage.getItem(STORAGE_KEYS.activeGame), null);
      if (activeGame && activeGame.gameSessionId === gameId) {
        setGameState(activeGame);
      } else {
        throw new Error('Game not found in browser storage');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load game');
    } finally {
      setLoading(false);
    }
  };

  const recordHit = async (gameId: number, playerId: number, targetNumber: number, hitValue: number) => {
    setLoading(true);
    setError(null);
    try {
      if (!CRICKET_NUMBERS.includes(targetNumber)) {
        throw new Error('Invalid target number. Must be 15-20 or 25 (Bull).');
      }
      if (hitValue < 1 || hitValue > 3 || (targetNumber === 25 && hitValue === 3)) {
        throw new Error('Invalid hit value for this target.');
      }

      setGameState(prev => {
        if (!prev) {
          throw new Error('No active game found');
        }

        validateGameAndCurrentPlayer(prev, gameId, playerId);

        const nextPlayers = prev.players.map(player => ({
          ...player,
          hitCounts: { ...player.hitCounts },
        }));
        const currentPlayer = nextPlayers.find(player => player.id === playerId)!;

        if (!isNumberClosedByAll(nextPlayers, targetNumber)) {
          const currentHits = currentPlayer.hitCounts[targetNumber] ?? 0;

          if (currentHits >= 3) {
            currentPlayer.score += targetNumber * hitValue;
          } else {
            const totalHits = currentHits + hitValue;
            const newHits = Math.min(3, totalHits);
            const overflow = Math.max(0, totalHits - 3);

            currentPlayer.hitCounts[targetNumber] = newHits;
            if (overflow > 0 && !isNumberClosedByAll(nextPlayers, targetNumber)) {
              currentPlayer.score += overflow * targetNumber;
            }
          }
        }

        currentPlayer.allClosed = checkAllNumbersClosed(currentPlayer);

        let dartsThisRound = prev.dartsThisRound + 1;
        let currentPlayerIndex = prev.currentPlayerIndex;

        if (dartsThisRound >= 3) {
          currentPlayerIndex = (currentPlayerIndex + 1) % nextPlayers.length;
          dartsThisRound = 0;
        }

        const updatedState: GameState = {
          ...prev,
          players: nextPlayers,
          dartsThisRound,
          currentPlayerIndex,
        };

        return finalizeGameIfWon(updatedState);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record hit');
    } finally {
      setLoading(false);
    }
  };

  const recordMiss = async (gameId: number, playerId: number) => {
    setLoading(true);
    setError(null);
    try {
      setGameState(prev => {
        if (!prev) {
          throw new Error('No active game found');
        }

        validateGameAndCurrentPlayer(prev, gameId, playerId);

        let dartsThisRound = prev.dartsThisRound + 1;
        let currentPlayerIndex = prev.currentPlayerIndex;

        if (dartsThisRound >= 3) {
          currentPlayerIndex = (currentPlayerIndex + 1) % prev.players.length;
          dartsThisRound = 0;
        }

        const updatedState: GameState = {
          ...prev,
          dartsThisRound,
          currentPlayerIndex,
        };

        return finalizeGameIfWon(updatedState);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record miss');
    } finally {
      setLoading(false);
    }
  };

  const skipToNextPlayer = async (gameId: number, playerId: number) => {
    setLoading(true);
    setError(null);
    try {
      setGameState(prev => {
        if (!prev) {
          throw new Error('No active game found');
        }

        validateGameAndCurrentPlayer(prev, gameId, playerId);

        const updatedState: GameState = {
          ...prev,
          currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length,
          dartsThisRound: 0,
        };

        return finalizeGameIfWon(updatedState);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to skip to next player');
    } finally {
      setLoading(false);
    }
  };

  const resetGame = () => {
    setGameState(null);
    setError(null);
  };

  const removeHit = async (gameId: number, playerId: number, targetNumber: number, previousScore: number, previousHitCount: number) => {
    setLoading(true);
    setError(null);
    try {
      setGameState(prev => {
        if (!prev || prev.gameSessionId !== gameId) {
          throw new Error('Active game not found');
        }

        const expectedCurrentPlayer = prev.players[prev.currentPlayerIndex];
        if (!expectedCurrentPlayer || expectedCurrentPlayer.id !== playerId) {
          throw new Error('Only the current player can undo scoring');
        }

        const nextPlayers = prev.players.map(player => ({
          ...player,
          hitCounts: { ...player.hitCounts },
        }));

        const player = nextPlayers.find(item => item.id === playerId);
        if (!player) {
          throw new Error('Player not found');
        }

        player.score = previousScore;
        player.hitCounts[targetNumber] = previousHitCount;
        player.allClosed = checkAllNumbersClosed(player);

        return {
          ...prev,
          players: nextPlayers,
          dartsThisRound: Math.max(0, prev.dartsThisRound - 1),
          status: 'IN_PROGRESS',
          winnerId: undefined,
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to undo score');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GameContext.Provider
      value={{
        gameState,
        gameHistory,
        savedPlayerNames,
        loading,
        error,
        createGame,
        loadGame,
        recordHit,
        recordMiss,
        skipToNextPlayer,
        resetGame,
        removeHit,
        clearSavedPlayerNames,
        addSavedPlayerName,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
