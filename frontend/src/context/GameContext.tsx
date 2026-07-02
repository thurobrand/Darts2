/**
 * Game context for managing game state across the application
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { GameState } from '../types';
import { gameApi } from '../services/api';

interface GameContextType {
  gameState: GameState | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  createGame: (sessionName: string, playerNames: string[]) => Promise<void>;
  loadGame: (gameId: number) => Promise<void>;
  recordHit: (gameId: number, playerId: number, targetNumber: number, hitValue: number) => Promise<void>;
  recordMiss: (gameId: number, playerId: number) => Promise<void>;
  skipToNextPlayer: (gameId: number, playerId: number) => Promise<void>;
  resetGame: () => void;
  removeHit: (gameId: number, playerId: number, targetNumber: number, previousScore: number, previousHitCount: number) => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGame = async (sessionName: string, playerNames: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const state = await gameApi.createGame(sessionName, playerNames);
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
      const state = await gameApi.getGameState(gameId);
      setGameState(state);
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
      const state = await gameApi.recordHit(gameId, {
        playerId,
        targetNumber,
        hitValue,
      });
      setGameState(state);
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
      const state = await gameApi.recordMiss(gameId, playerId);
      setGameState(state);
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
      const state = await gameApi.skipToNextPlayer(gameId, playerId);
      setGameState(state);
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
      const state = await gameApi.removeHit(gameId, playerId, targetNumber, previousScore, previousHitCount);
      setGameState(state);
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
        loading,
        error,
        createGame,
        loadGame,
        recordHit,
        recordMiss,
        skipToNextPlayer,
        resetGame,
        removeHit,
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
