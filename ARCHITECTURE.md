# Cricket Darts SPA - Architecture

## High-Level Design

```text
┌──────────────────────────────────────────────────────────────────┐
│                         Browser (React)                          │
│                                                                  │
│  App -> GameSetup -> Scoreboard -> HitSelector/WinnerPopup       │
│               │                                                  │
│               ▼                                                  │
│      GameContext (single source of truth)                        │
│      - gameState                                                 │
│      - savedPlayerNames                                          │
│      - gameHistory                                               │
│      - local scoring actions                                     │
│                                                                  │
│      localStorage                                                │
│      - darts2.activeGame                                         │
│      - darts2.savedPlayers                                       │
│      - darts2.gameHistory                                        │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                     Spring Boot Backend                           │
│  - CricketDartsApplication                                       │
│  - HealthController                                              │
│  - GET /health                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## Frontend Responsibilities

- Own all Cricket rules and score calculations
- Enforce turn order (`currentPlayerIndex`, `dartsThisRound`)
- Determine winner and game completion
- Persist active game, player names, and completed history in browser storage

## Backend Responsibilities

- Provide application runtime/container target
- Expose readiness endpoint (`GET /health`)
- No game state, scoring, or persistence APIs

## Game State Model (Frontend)

- `GameState`
- `Player`
- `GameHistoryEntry`

Core state updates are handled in `frontend/src/context/GameContext.tsx`.

## Operational Notes

- Restarting or refreshing the browser restores active game state from `localStorage`
- Completed games are appended to history with completion timestamps
- Docker startup readiness checks should target `/health`
