/**
 * Type definitions for the Cricket Darts game
 */

export interface Player {
  id: number;
  name: string;
  playerNumber: number;
  hitCounts: Record<number, number>; // number -> hit count
  score: number;
  allClosed: boolean;
}

export interface GameState {
  gameSessionId: number;
  sessionName: string;
  status: "IN_PROGRESS" | "COMPLETED";
  winnerId?: number;
  players: Player[];
  currentPlayerIndex: number;
  dartsThisRound: number;
}

export interface HitRequest {
  gameSessionId: number;
  playerId: number;
  targetNumber: number; // 15-20 or 25
  hitValue: number; // 1, 2, or 3
}

export const CRICKET_NUMBERS = [15, 16, 17, 18, 19, 20, 25];

export const CRICKET_NUMBER_LABELS: Record<number, string> = {
  15: "15",
  16: "16",
  17: "17",
  18: "18",
  19: "19",
  20: "20",
  25: "Bull"
};
