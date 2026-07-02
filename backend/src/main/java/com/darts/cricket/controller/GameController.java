package com.darts.cricket.controller;

import com.darts.cricket.dto.GameStateResponse;
import com.darts.cricket.dto.HitRequest;
import com.darts.cricket.model.GameSession;
import com.darts.cricket.service.GameService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Cricket Darts game API.
 * 
 * Endpoints:
 * - POST /api/games - Create a new game
 * - GET /api/games/{id} - Get game state
 * - POST /api/games/{id}/hit - Record a hit
 */
@RestController
@RequestMapping("/api/games")
@RequiredArgsConstructor
public class GameController {
    
    private final GameService gameService;
    
    /**
     * Create a new game session.
     * 
     * @param request containing sessionName and list of player names
     * @return Created game session
     */
    @PostMapping
    public ResponseEntity<GameStateResponse> createGame(@RequestBody CreateGameRequest request) {
        try {
            GameSession session = gameService.createGameSession(request.getSessionName(), request.getPlayerNames());
            GameStateResponse response = GameStateResponse.fromGameSession(session);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * Lightweight readiness endpoint for container startup checks.
     */
    @GetMapping("/health")
    public ResponseEntity<Void> health() {
        return ResponseEntity.ok().build();
    }
    
    /**
     * Get current game state.
     * 
     * @param gameId ID of the game session
     * @return Current game state
     */
    @GetMapping("/{gameId}")
    public ResponseEntity<GameStateResponse> getGameState(@PathVariable Long gameId) {
        try {
            GameStateResponse state = gameService.getGameState(gameId);
            return ResponseEntity.ok(state);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
    
    /**
     * Record a hit in the game.
     * 
     * @param gameId ID of the game session
     * @param hitRequest containing target number, hit value, and player info
     * @return Updated game state
     */
    @PostMapping("/{gameId}/hit")
    public ResponseEntity<GameStateResponse> recordHit(
            @PathVariable Long gameId,
            @RequestBody HitRequest hitRequest) {
        try {
            hitRequest.setGameSessionId(gameId);
            GameStateResponse state = gameService.recordHit(hitRequest);
            return ResponseEntity.ok(state);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Record a miss (no hit on a dart) and advance the dart counter.
     * 
     * @param gameId ID of the game session
     * @param request containing playerId
     * @return Updated game state
     */
    @PostMapping("/{gameId}/miss")
    public ResponseEntity<GameStateResponse> recordMiss(
            @PathVariable Long gameId,
            @RequestBody MissRequest request) {
        try {
            GameStateResponse state = gameService.recordMiss(gameId, request.getPlayerId());
            return ResponseEntity.ok(state);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Skip the current player's remaining darts and move to the next player.
     * 
     * @param gameId ID of the game session
     * @param request containing playerId
     * @return Updated game state
     */
    @PostMapping("/{gameId}/skip")
    public ResponseEntity<GameStateResponse> skipToNextPlayer(
            @PathVariable Long gameId,
            @RequestBody SkipRequest request) {
        try {
            GameStateResponse state = gameService.skipToNextPlayer(gameId, request.getPlayerId());
            return ResponseEntity.ok(state);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Change whose turn it is to a specific player.
     * 
     * @param gameId ID of the game session
     * @param request containing playerId to change focus to
     * @return Updated game state
     */
    @PostMapping("/{gameId}/setTurn")
    public ResponseEntity<GameStateResponse> setPlayerTurn(
            @PathVariable Long gameId,
            @RequestBody SetTurnRequest request) {
        try {
            GameStateResponse state = gameService.setPlayerTurn(gameId, request.getPlayerId());
            return ResponseEntity.ok(state);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Remove/undo a hit on a specific target number.
     * 
     * @param gameId ID of the game session
     * @param request containing playerId and targetNumber
     * @return Updated game state
     */
    @PostMapping("/{gameId}/removeHit")
    public ResponseEntity<GameStateResponse> removeHit(
            @PathVariable Long gameId,
            @RequestBody RemoveHitRequest request) {
        try {
            GameStateResponse state = gameService.removeHit(gameId, request.getPlayerId(), request.getTargetNumber(),
                    request.getPreviousScore(), request.getPreviousHitCount());
            return ResponseEntity.ok(state);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Request DTO for creating a new game.
     */
    @lombok.Data
    @lombok.NoArgsConstructor
    public static class CreateGameRequest {
        private String sessionName;
        private List<String> playerNames;
    }

    /**
     * Request DTO for recording a miss.
     */
    @lombok.Data
    @lombok.NoArgsConstructor
    public static class MissRequest {
        private Long playerId;
    }

    /**
     * Request DTO for skipping to the next player.
     */
    @lombok.Data
    @lombok.NoArgsConstructor
    public static class SkipRequest {
        private Long playerId;
    }
    /**
     * Request DTO for changing whose turn it is.
     */
    @lombok.Data
    @lombok.NoArgsConstructor
    public static class SetTurnRequest {
        private Long playerId;
    }

    /**
     * Request DTO for removing a hit.
     */
    @lombok.Data
    @lombok.NoArgsConstructor
    public static class RemoveHitRequest {
        private Long playerId;
        private Integer targetNumber;
        private Integer previousScore;
        private Integer previousHitCount;
    }
}
