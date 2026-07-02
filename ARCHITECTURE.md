# Cricket Darts SPA - Architecture Documentation

## System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER (React)                      │
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   App.tsx    │  │  Scoreboard  │  │  Keypad.tsx  │        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
│         │                  │                  │                │
│         └──────────┬───────┴──────────┬───────┘                │
│                    │                  │                        │
│              ┌─────▼──────────────────▼─────┐                 │
│              │  GameContext (State Mgmt)    │                 │
│              │  - gameState                 │                 │
│              │  - actions                   │                 │
│              └─────┬──────────────────┬─────┘                 │
│                    │                  │                        │
│         ┌──────────▼─────┐  ┌────────▼──────────┐             │
│         │   api.ts       │  │  types.ts        │             │
│         │ - createGame() │  │ - GameState      │             │
│         │ - recordHit()  │  │ - Player         │             │
│         │ - getGame()    │  │ - HitRequest     │             │
│         └────────┬───────┘  └──────────────────┘             │
└────────────────────┼─────────────────────────────────────────┘
                     │
                  HTTP/REST
                     │
                  :8080/api
                     │
┌────────────────────▼─────────────────────────────────────────┐
│                 API LAYER (Spring Boot)                       │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │           GameController (@RestController)             │  │
│  │  POST   /api/games              → createGame()         │  │
│  │  GET    /api/games/{id}         → getGameState()      │  │
│  │  POST   /api/games/{id}/hit     → recordHit()         │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │                                      │
│  ┌────────────────────▼─────────────────────────────────┐  │
│  │        GameService (@Service)                        │  │
│  │  - createGameSession()                               │  │
│  │  - recordHit()                                       │  │
│  │  - processHit()                                      │  │
│  │  - scorePointsIfOpponentNotClosed()                  │  │
│  │  - checkWinCondition()                               │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │                                      │
│  ┌────────────────────▼─────────────────────────────────┐  │
│  │    GameSessionRepository (@Repository)               │  │
│  │    (Spring Data JPA Interface)                        │  │
│  └────────────────────┬─────────────────────────────────┘  │
└────────────────────────┼──────────────────────────────────┘
                        │
                     JPA/Hibernate
                        │
┌────────────────────────▼──────────────────────────────────────┐
│              DATABASE LAYER (H2 In-Memory)                    │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Table: GAME_SESSION                                 │   │
│  │  - id (PK)                                            │   │
│  │  - session_name                                       │   │
│  │  - status                                             │   │
│  │  - winner_id                                          │   │
│  │  - created_at, updated_at                             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Table: PLAYER                                        │   │
│  │  - id (PK)                                            │   │
│  │  - game_session_id (FK)                               │   │
│  │  - name                                               │   │
│  │  - player_number                                      │   │
│  │  - score                                              │   │
│  │  - all_closed                                         │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Table: PLAYER_HIT_COUNTS (Map Collection)            │   │
│  │  - player_id (FK)                                     │   │
│  │  - hit_counts_key (15-25)                             │   │
│  │  - hit_counts_value (0-3)                             │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

---

## Component Interaction Diagram

### Game Initialization Flow

```
┌─────────────────┐
│   User enters   │
│  player names   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  GameSetup Component    │
│  - Session name         │
│  - Player count         │
│  - Player names         │
└────────┬────────────────┘
         │
         │ handleStartGame()
         │
         ▼
┌─────────────────────────┐
│  GameContext            │
│  createGame()           │
└────────┬────────────────┘
         │
         │ axios.post() 
         │
         ▼
┌──────────────────────────────────┐
│  Backend: GameController         │
│  POST /api/games                 │
│  - CreateGameRequest             │
└────────┬─────────────────────────┘
         │
         │ new GameSession()
         │ 2-4 Players created
         │
         ▼
┌──────────────────────────────────┐
│  GameService.createGameSession() │
│  1. Create GameSession entity    │
│  2. Add Players                  │
│  3. Initialize hitCounts         │
│  4. Save to database             │
└────────┬─────────────────────────┘
         │
         │ GameStateResponse
         │
         ▼
┌─────────────────────────┐
│  GameContext            │
│  setGameState()         │
└────────┬────────────────┘
         │
         │ State update
         │
         ▼
┌─────────────────────────┐
│  App re-renders         │
│  Shows Scoreboard       │
└─────────────────────────┘
```

### Hit Recording Flow

```
┌─────────────────────────────┐
│  User selects number +      │
│  hit value in Keypad        │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Keypad Component           │
│  handleHitSubmit()          │
└────────┬────────────────────┘
         │
         │ Context.recordHit(
         │   gameId,
         │   playerId,
         │   targetNumber,
         │   hitValue
         │ )
         │
         ▼
┌──────────────────────────────────┐
│  Backend: GameController         │
│  POST /api/games/{id}/hit        │
│  - HitRequest (validation)       │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  GameService.recordHit()         │
│  1. Load GameSession & Player    │
│  2. Validate hit (1-3)           │
│  3. Validate target (15-20, 25)  │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  processHit()                    │
│  1. Get current hit count        │
│  2. Is already closed?           │
│     ├─ YES: scorePoints()        │
│     └─ NO: Add hits              │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  checkWinCondition()             │
│  1. Any player all closed?       │
│  2. Highest score?               │
│  3. Set winner & status          │
└────────┬─────────────────────────┘
         │
         │ GameStateResponse
         │
         ▼
┌──────────────────────────────────┐
│  GameContext setGameState()      │
│  Update {                        │
│    players: [...],               │
│    status,                       │
│    winnerId                      │
│  }                               │
└────────┬─────────────────────────┘
         │
         │ State propagation
         │
         ▼
┌──────────────────────────────────┐
│  Components re-render:           │
│  - Scoreboard updates            │
│  - PlayerColumn scores update    │
│  - Hit status visualized         │
│  - Keypad disabled if game over  │
└──────────────────────────────────┘
```

---

## Entity Relationship Diagram

```
┌─────────────────────────────────┐
│      GameSession                │
├─────────────────────────────────┤
│ id (PK)              : Long     │
│ sessionName          : String   │
│ status               : Enum     │
│ winnerId             : Long     │
│ players              : List<>   │
│ createdAt            : DateTime │
│ updatedAt            : DateTime │
└────────────┬────────────────────┘
             │
             │ 1:N relationship
             │ @OneToMany
             │ cascade=ALL
             │
             ▼
┌─────────────────────────────────┐
│      Player                     │
├─────────────────────────────────┤
│ id (PK)              : Long     │
│ gameSession (FK)     : Ref      │
│ name                 : String   │
│ playerNumber         : int      │
│ hitCounts (Map)      : Map<>    │
│   Key: Int (15-25)              │
│   Val: Int (0-3)                │
│ score                : int      │
│ allClosed            : boolean  │
└─────────────────────────────────┘
```

---

## State Management Architecture

```
┌──────────────────────────────────────┐
│        GameContext (React Context)   │
├──────────────────────────────────────┤
│                                      │
│ State:                               │
│  - gameState: GameState | null       │
│  - loading: boolean                  │
│  - error: string | null              │
│                                      │
│ Actions:                             │
│  - createGame(name, names)           │
│  - loadGame(id)                      │
│  - recordHit(id, playerId, ...)      │
│                                      │
└┬─────────────────────────────────────┤
 │                                      │
 │  Consumed by:                        │
 │  - App.tsx                           │
 │  - GameSetup.tsx                     │
 │  - Scoreboard.tsx                    │
 │  - Keypad.tsx                        │
 │  - PlayerColumn.tsx (via parent)     │
 │                                      │
 └──────────────────────────────────────┘
```

---

## API Request/Response Examples

### Game State Object Structure

```typescript
interface GameState {
  gameSessionId: number;
  sessionName: string;
  status: "IN_PROGRESS" | "COMPLETED";
  winnerId?: number;
  players: [
    {
      id: number;
      name: string;
      playerNumber: number;
      hitCounts: {
        15: 0,
        16: 2,
        17: 3,
        18: 1,
        19: 0,
        20: 3,
        25: 0
      };
      score: 100;
      allClosed: false;
    },
    ...
  ];
}
```

### Hit Request Structure

```typescript
interface HitRequest {
  gameSessionId: number;
  playerId: number;
  targetNumber: number;  // 15-20, 25
  hitValue: number;      // 1, 2, 3
}
```

---

## Error Handling Strategy

### Backend Validation

```
HitRequest received
  ├─ Valid gameSessionId?
  │  └─ NO → 404 Not Found
  │
  ├─ Valid playerId?
  │  └─ NO → 404 Not Found
  │
  ├─ Valid hitValue (1-3)?
  │  └─ NO → 400 Bad Request
  │
  ├─ Valid targetNumber (15-20, 25)?
  │  └─ NO → 400 Bad Request
  │
  └─ Game status = IN_PROGRESS?
     └─ NO → 400 Bad Request

On error → Return error response to frontend
```

### Frontend Error Handling

```
API call
  ├─ Success → Update gameState
  │
  └─ Failure
     ├─ Network error → Show generic message
     ├─ 4xx error → Show validation message
     └─ 5xx error → Show server error message
```

---

## Performance Considerations

### Backend
- **H2 In-Memory**: Fast for prototype, adequate for learning
- **No N+1 queries**: GameSession loads all Players via EAGER fetch
- **Stateless**: Each request is independent (scalable)

### Frontend
- **Vite**: Fast builds and HMR during development
- **React Context**: Sufficient for single-game scope
- **Tailwind CSS**: Only includes used styles in production build

### Communication
- **REST API**: Simple and cacheable GET requests
- **JSON serialization**: Lightweight data transfer
- **Minimal payload**: Only game state on each hit

---

## Deployment Architecture (Future)

```
┌────────────────────────────────┐
│  Frontend (React SPA)          │
│  - Build: npm run build        │
│  - Host: CDN / Static hosting  │
└────────────────┬───────────────┘
                 │
                 │ HTTPS API calls
                 │
┌────────────────▼───────────────┐
│  Backend (Spring Boot API)     │
│  - Build: mvn clean package    │
│  - Host: Cloud platform        │
│         (AWS, Azure, Heroku)   │
└────────────────┬───────────────┘
                 │
                 │ JDBC
                 │
┌────────────────▼───────────────┐
│  Database                      │
│  - PostgreSQL / MySQL          │
│  - Cloud managed service       │
└────────────────────────────────┘
```

---

## Security Considerations

1. **CORS**: Configured to specific origin (localhost:5173)
2. **Input Validation**: Hit values (1-3), target numbers (15-25)
3. **Server-side Logic**: Game rules enforced on backend
4. **Stateless APIs**: No session hijacking risks

### Production Recommendations

- Enable HTTPS only
- Implement request rate limiting
- Add authentication/authorization
- Validate all inputs server-side
- Use environment variables for secrets
- Implement request logging

---

## Testing Strategy

### Backend Unit Tests
```java
// GameService tests
- testCreateGameSession_Success
- testCreateGameSession_InvalidPlayers
- testRecordHit_ValidHit
- testRecordHit_InvalidNumber
- testRecordHit_ScoresPoints
- testWinCondition_PlayerWins
```

### Frontend Component Tests
```typescript
// ReactStesting Library
- GameSetup renders form
- GameSetup creates game on submit
- Scoreboard displays players
- Keypad enables hit submission
- PlayerColumn shows hit status
```

### Integration Tests
```
- Create game → Get game → Record hit → Get updated state
- Multi-hit sequence → Score calculation
- Win condition detection
```

---

**Last Updated**: February 10, 2026
**Status**: Complete MVP with extensible architecture
