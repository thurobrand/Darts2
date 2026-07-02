/**
 * API service for communicating with the backend
 */

import axios from 'axios';
import { GameState, HitRequest } from '../types';

const API_BASE_URL =
  (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_API_BASE_URL ||
  '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface CreateGameRequest {
  sessionName: string;
  playerNames: string[];
}

export const gameApi = {
  /**
   * Create a new game session
   */
  createGame: async (sessionName: string, playerNames: string[]): Promise<GameState> => {
    const response = await apiClient.post<GameState>('/games', {
      sessionName,
      playerNames,
    } as CreateGameRequest);
    return response.data;
  },

  /**
   * Get the current game state
   */
  getGameState: async (gameId: number): Promise<GameState> => {
    const response = await apiClient.get<GameState>(`/games/${gameId}`);
    return response.data;
  },

  /**
   * Record a hit in the game
   */
  recordHit: async (gameId: number, hitRequest: Omit<HitRequest, 'gameSessionId'>): Promise<GameState> => {
    const response = await apiClient.post<GameState>(`/games/${gameId}/hit`, {
      ...hitRequest,
      gameSessionId: gameId,
    } as HitRequest);
    return response.data;
  },

  /**
   * Record a miss (dart that scored no points)
   */
  recordMiss: async (gameId: number, playerId: number): Promise<GameState> => {
    const response = await apiClient.post<GameState>(`/games/${gameId}/miss`, {
      playerId,
    });
    return response.data;
  },

  /**
   * Skip to the next player (end current player's turn immediately)
   */
  skipToNextPlayer: async (gameId: number, playerId: number): Promise<GameState> => {
    const response = await apiClient.post<GameState>(`/games/${gameId}/skip`, {
      playerId,
    });
    return response.data;
  },

  /**
   * Undo the previous score on a target number
   */
  removeHit: async (gameId: number, playerId: number, targetNumber: number, previousScore: number, previousHitCount: number): Promise<GameState> => {
    const response = await apiClient.post<GameState>(`/games/${gameId}/removeHit`, {
      playerId,
      targetNumber,
      previousScore,
      previousHitCount,
    });
    return response.data;
  },
};
