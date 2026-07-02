# 🎯 Cricket Darts Scorer - Single Page Application (SPA)

A comprehensive full-stack application for scoring and tracking cricket darts games. Built with Spring Boot backend and React frontend using modern development technologies.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Game Rules](#game-rules)
- [Backend Architecture](#backend-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Setup & Installation](#setup--installation)
- [API Documentation](#api-documentation)
- [Component Hierarchy](#component-hierarchy)

---

## 🎮 Project Overview

Cricket Darts is a competitive dart game where players race to "close" all numbers (15-20 and Bullseye/25) and score points on closed numbers when opponents haven't closed them yet.

### Key Features

- Real-time game scoring
- Multi-player support (2-4 players)
- Persistent game sessions with H2 database
- REST API for game operations
- Responsive React UI with Tailwind CSS
- Type-safe TypeScript implementation

---

## 📁 Project Structure

This is a **mono-repo** approach keeping backend and frontend in a single project directory:

```
Darts2/
├── backend/                          # Spring Boot Application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/darts/cricket/
│   │   │   │   ├── CricketDartsApplication.java    # Application entry point
│   │   │   │   ├── controller/
│   │   │   │   │   └── GameController.java         # REST endpoints
│   │   │   │   ├── service/
│   │   │   │   │   └── GameService.java            # Game logic
│   │   │   │   ├── model/
│   │   │   │   │   ├── GameSession.java            # Game entity
│   │   │   │   │   ├── Player.java                 # Player entity
│   │   │   │   │   └── GameStatus.java             # Enum
│   │   │   │   ├── repository/
│   │   │   │   │   └── GameSessionRepository.java  # JPA repository
│   │   │   │   └── dto/
│   │   │   │       ├── HitRequest.java             # Request DTO
│   │   │   │       ├── GameStateResponse.java      # Response DTO
│   │   │   │       └── PlayerStateDto.java         # Player DTO
│   │   │   └── resources/
│   │   │       └── application.properties          # Spring config
│   │   └── test/java                                # Unit tests
│   └── pom.xml                                      # Maven config
│
├── frontend/                         # React + Vite Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── App.tsx                             # Main app component
│   │   │   ├── Scoreboard.tsx                      # Game scoreboard
│   │   │   ├── PlayerColumn.tsx                    # Player display
│   │   │   ├── Keypad.tsx                          # Score input
│   │   │   └── GameSetup.tsx                       # Game initialization
│   │   ├── context/
│   │   │   └── GameContext.tsx                     # State management
│   │   ├── services/
│   │   │   └── api.ts                              # API client
│   │   ├── types.ts                                # TypeScript types
│   │   ├── index.css                               # Global styles
│   │   └── main.tsx                                # Entry point
│   ├── public/                                      # Static assets
│   ├── index.html                                   # HTML template
│   ├── vite.config.ts                              # Vite config
│   ├── tsconfig.json                               # TypeScript config
│   ├── tailwind.config.js                          # Tailwind config
│   ├── postcss.config.js                           # PostCSS config
│   └── package.json                                # NPM dependencies
│
└── README.md                         # This file
```

---

## 🛠 Tech Stack

### Backend
- **Runtime**: Java 17+
- **Framework**: Spring Boot 3.2.0
  - Spring Web (REST APIs)
  - Spring Data JPA (Persistence)
  - Spring CORS support
- **Database**: H2 (In-memory, automatic schema generation)
- **Build Tool**: Maven
- **Utilities**: Lombok (boilerplate reduction)

### Frontend
- **Runtime**: Node.js 16+
- **Framework**: React 18
- **Build Tool**: Vite (lightning-fast builds)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3
- **HTTP Client**: Axios
- **State Management**: React Context API

---

## 🎲 Game Rules

### Game Objective
Close all cricket numbers (15, 16, 17, 18, 19, 20, Bullseye=25) with the highest score.

### How to Close a Number
- A number is "closed" after 3 hits
- **Single** = 1 hit
- **Double** = 2 hits
- **Triple** = 3 hits (immediately closes a number)

### Scoring Points
- Once a player closes a number, any subsequent hits on that number score points
- Points only count if **at least one opponent hasn't closed that number**
- Point value = number × hit value
  - Example: Hitting triple 20 when closed = 60 points (20 × 3)

### Win Condition
A player wins by:
1. Closing ALL seven numbers (15-20, Bullseye)
2. Having the highest score among all players with all numbers closed

---

## 🏗 Backend Architecture

### Entity Relationships

```
GameSession (1) ──> (Many) Player
   ├─ id
   ├─ sessionName
   ├─ status (IN_PROGRESS | COMPLETED)
   ├─ winnerId
   ├─ createdAt
   └─ updatedAt

Player
   ├─ id
   ├─ name
   ├─ playerNumber
   ├─ hitCounts (Map: {15→2, 16→0, ...})
   ├─ score (int)
   └─ allClosed (boolean)
```

### Service Layer (GameService)

**Primary Methods:**

1. **`createGameSession(sessionName, playerNames)`**
   - Creates new game with players
   - Initializes hit counts for each player

2. **`recordHit(HitRequest)`**
   - Processes dart hit for a player
   - Updates hit counts
   - Awards points if applicable
   - Checks win conditions

3. **`checkWinCondition(session)`**
   - Verifies if any player meets win criteria
   - Updates game status to COMPLETED
   - Sets winner ID

### Game Logic Flow

```
Player records hit
    ↓
Check if number already closed
    ├─ YES → Score points (if opponent not closed)
    └─ NO → Increment hit count
    ↓
Check if all numbers now closed
    ├─ YES → Update allClosed flag
    └─ NO → Continue
    ↓
Check win condition
    ├─ All closed + highest score → Game ends
    └─ Continue
    ↓
Return updated GameState to client
```

### REST API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/games` | Create new game session |
| GET | `/api/games/{gameId}` | Get current game state |
| POST | `/api/games/{gameId}/hit` | Record a hit |

---

## ⚛️ Frontend Architecture

### Component Hierarchy

```
App
├── GameSetup
│   └── [Takes player names and creates game]
│
└── Scoreboard (when game exists)
    ├── PlayerColumn (× 2-4)
    │   └── [Displays player score and hit status]
    │
    └── Keypad
        ├── [Cricket number selection grid]
        └── [Single/Double/Triple buttons]
```

### State Management (GameContext)

The application uses **React Context API** for global state management:

```typescript
interface GameContextType {
  gameState: GameState | null;      // Current game data
  loading: boolean;                 // API call status
  error: string | null;             // Error messages
  
  createGame(...);                  // Create new game
  loadGame(...);                    // Load existing game
  recordHit(...);                   // Submit hit
}
```

### Component Descriptions

#### **App.tsx**
- Root component
- Conditionally renders GameSetup or Scoreboard
- Wraps app with GameProvider

#### **GameSetup.tsx**
- Form for game initialization
- Inputs: session name, player count, player names
- Calls `createGame()` from context

#### **Scoreboard.tsx**
- Main game view
- Displays all players
- Conditionally shows Keypad
- Shows game-over message and winner

#### **PlayerColumn.tsx**
- Individual player display card
- Shows name and total score
- Displays hit status for each cricket number
- Shows closed status (✓) for completed numbers
- Selectable to input scores

#### **Keypad.tsx**
- Score input interface (only visible when player selected)
- 7 buttons for cricket numbers (15-20, Bull)
- 3 action buttons: Single, Double, Triple
- Sends hit request to API

---

## 🚀 Setup & Installation

### Prerequisites

- **Java 17+** (for backend)
- **Node.js 16+** (for frontend)
- **Maven** (for backend build)
- **npm** or **yarn** (for frontend dependencies)

### Backend Setup

1. **Navigate to backend:**
   ```bash
   cd backend
   ```

2. **Install dependencies & build:**
   ```bash
   mvn clean install
   ```

3. **Run Spring Boot application:**
   ```bash
   mvn spring-boot:run
   ```

   The backend will start on `http://localhost:8080`

4. **H2 Console (optional):**
   - Access: `http://localhost:8080/h2-console`
   - JDBC URL: `jdbc:h2:mem:cricketdb`
   - Username: `sa`
   - Password: (leave empty)

### Frontend Setup

1. **Navigate to frontend:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
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
