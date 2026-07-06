# Cricket Darts Scorer

A browser-native Cricket darts scorer with a React frontend and a minimal Spring Boot backend runtime.

## Overview

Game scoring and turn management run entirely in the browser.
The frontend persists state in browser storage, including:

- Active game state
- Saved player names
- Completed game history

The backend no longer exposes game-scoring endpoints. It now provides runtime support and a health endpoint.

## Project Structure

```text
Darts2/
├── backend/
│   ├── src/main/java/com/darts/cricket/
│   │   ├── CricketDartsApplication.java
│   │   └── controller/
│   │       └── HealthController.java
│   ├── src/main/resources/
│   │   └── application.properties
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   ├── context/
│   │   │   └── GameContext.tsx
│   │   └── types.ts
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml
└── run-compose.sh
```

## Tech Stack

### Backend
- Java 17+
- Spring Boot 3.2 (Spring Web)
- Maven

### Frontend
- React 18
- TypeScript 5
- Vite
- Tailwind CSS

## Gameplay Rules

- Targets are 15, 16, 17, 18, 19, 20, and Bull (25)
- Single = 1 mark, Double = 2 marks, Triple = 3 marks (Bull allows single/double)
- A number is closed at 3 marks
- Overflow marks score points only while at least one opponent has not closed that target
- Turns rotate after 3 darts
- A winner must have all numbers closed and score greater than or equal to all opponents

## Browser Storage Keys

Frontend state is persisted with these keys:

- `darts2.activeGame`
- `darts2.savedPlayers`
- `darts2.gameHistory`

## Backend Endpoint

- `GET /health` for readiness checks

## Local Development

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
mvn spring-boot:run
```

## Docker Compose

```bash
./run-compose.sh up
```

The script waits for backend readiness using `http://localhost:8080/health` and exposes frontend on port 80 by default (or 8080 for some rootless Podman setups).
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

   The frontend will start on `http://localhost:5173`

4. **Build for production:**
   ```bash
   npm run build
   ```

### Full Startup (from project root)

```bash
# Terminal 1: Backend
cd backend
mvn spring-boot:run

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

---

## 📡 API Documentation

### 1. Create Game Session

**Request:**
```http
POST /api/games
Content-Type: application/json

{
  "sessionName": "Tournament Game 1",
  "playerNames": ["Alice", "Bob", "Charlie"]
}
```

**Response (201 Created):**
```json
{
  "gameSessionId": 1,
  "sessionName": "Tournament Game 1",
  "status": "IN_PROGRESS",
  "winnerId": null,
  "players": [
    {
      "id": 1,
      "name": "Alice",
      "playerNumber": 1,
      "hitCounts": {
        "15": 0, "16": 0, "17": 0, "18": 0,
        "19": 0, "20": 0, "25": 0
      },
      "score": 0,
      "allClosed": false
    },
    ...
  ]
}
```

### 2. Get Game State

**Request:**
```http
GET /api/games/1
```

**Response:**
```json
{
  "gameSessionId": 1,
  "sessionName": "Tournament Game 1",
  "status": "IN_PROGRESS",
  "winnerId": null,
  "players": [...]
}
```

### 3. Record Hit

**Request:**
```http
POST /api/games/1/hit
Content-Type: application/json

{
  "playerId": 1,
  "targetNumber": 20,
  "hitValue": 3
}
```

**Response:**
```json
{
  "gameSessionId": 1,
  "sessionName": "Tournament Game 1",
  "status": "IN_PROGRESS",
  "winnerId": null,
  "players": [
    {
      "id": 1,
      "name": "Alice",
      "playerNumber": 1,
      "hitCounts": {
        "15": 0, "16": 0, "17": 0, "18": 0,
        "19": 0, "20": 3, "25": 0
      },
      "score": 0,
      "allClosed": false
    },
    ...
  ]
}
```

### Error Responses

**400 Bad Request:**
```json
{
  "error": "Invalid target number. Must be 15-20 or 25 (Bullseye)"
}
```

**404 Not Found:**
```json
{
  "error": "Game session not found"
}
```

---

## 🧩 Component Hierarchy (Detailed)

```
┌─────────────────────────────────────────────────┐
│                    App.tsx                      │
│  (Renders GameSetup OR Scoreboard)              │
└────────────────────┬────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
    ┌───▼──────────┐      ┌──────▼───────┐
    │ GameSetup    │      │  Scoreboard   │
    │              │      │               │
    │ ┌──────────┐ │      │ ┌───────────┐ │
    │ │Input Form│ │      │ │Game Header│ │
    │ │  - Name  │ │      │ │ - Status  │ │
    │ │  - Count │ │      │ │ - Winner  │ │
    │ │  - Names │ │      │ └───────────┘ │
    │ └──────────┘ │      │ ┌───────────┐ │
    │              │      │ │PlayerCol. │ │ (Multiple)
    │              │      │ │Player Col.│ │
    └──────────────┘      │ └───────────┘ │
                          │ ┌───────────┐ │
                          │ │  Keypad   │ │
                          │ │  Numbers  │ │
                          │ │  Hit Opts │ │
                          │ └───────────┘ │
                          └───────────────┘
```

### Component Responsibilities

| Component | Role | State | Parent |
|-----------|------|-------|--------|
| App | Router/Layout | gameState | Root |
| GameSetup | Game initialization | playerNames, playerCount | App |
| Scoreboard | Game display | selectedPlayerId | App |
| PlayerColumn | Player info display | (none) | Scoreboard |
| Keypad | Hit input | selectedNumber | Scoreboard |

---

## 📊 Data Flow

### Game Creation Flow

```
User inputs players → GameSetup submits → Context.createGame()
   ↓
Backend creates GameSession + Players
   ↓
Context stores gameState
   ↓
App re-renders with Scoreboard
```

### Hit Recording Flow

```
User selects number + hit type in Keypad
   ↓
Keypad calls Context.recordHit()
   ↓
API POST /games/{id}/hit
   ↓
Backend GameService.processHit()
   ├─ Update hitCounts
   ├─ Award points (if applicable)
   ├─ Check win condition
   └─ Return updated GameState
   ↓
Context updates gameState
   ↓
Components re-render with new state
```

---

## 🎨 UI/UX Features

- **Dark theme** using Tailwind CSS for reduced eye strain
- **Responsive grid layout** adapts to 2-4 players
- **Click-to-select** player for intuitive interaction
- **Visual feedback** with color-coded status indicators
  - Green: Closed numbers
  - Yellow: Current score
  - Blue: Selected player
- **Disabled states** during API calls

---

## 🧪 Testing & Development

### Backend Testing
```bash
cd backend
mvn test
```

### Frontend Testing
```bash
cd frontend
npm run build  # Type checking with tsc
```

### Development with Hot Reload
- **Backend**: Recompile with Maven (or use Spring DevTools)
- **Frontend**: Automatic with Vite

---

## 🔒 CORS Configuration

Backend allows requests from `http://localhost:5173` (frontend dev server).

To configure for production, update `application.properties`:
```properties
spring.web.cors.allowed-origins=https://your-domain.com
```

---

## 📝 Future Enhancements

- [ ] Game history and statistics
- [ ] Undo last hit functionality
- [ ] Auto-save to local storage
- [ ] Sound effects for hits
- [ ] Replay game analysis
- [ ] Mobile-optimized UI
- [ ] WebSocket for real-time multiplayer
- [ ] User authentication & profiles

---

## 📄 License

This project is provided as-is for educational purposes.

---

## 👨‍💻 Development Notes

### Adding New Features

1. **Backend**: Add new endpoints in `GameController`, add logic to `GameService`
2. **Frontend**: Create component in `components/`, add API methods in `api.ts`
3. **Types**: Update `types.ts` for TypeScript safety

### Database Persistence

H2 is configured for in-memory storage (resets on app restart). To use persistent file storage, update `application.properties`:

```properties
spring.datasource.url=jdbc:h2:file:./data/cricketdb
```

---

**Happy Scoring! 🎯**
