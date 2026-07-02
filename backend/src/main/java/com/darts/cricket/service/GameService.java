package com.darts.cricket.service;

import com.darts.cricket.dto.GameStateResponse;
import com.darts.cricket.dto.HitRequest;
import com.darts.cricket.model.GameSession;
import com.darts.cricket.model.Player;
import com.darts.cricket.model.GameStatus;
import com.darts.cricket.repository.GameSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service for managing Cricket Darts game logic.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class GameService {
    
    private final GameSessionRepository gameSessionRepository;
    private final CricketScoringService cricketScoringService;
    
    /**
     * Create a new game session with players.
     */
    public GameSession createGameSession(String sessionName, List<String> playerNames) {
        GameSession session = new GameSession();
        session.setSessionName(sessionName);
        
        int playerNumber = 1;
        for (String playerName : playerNames) {
            Player player = new Player();
            player.setName(playerName);
            player.setPlayerNumber(playerNumber);
            player.setGameSession(session);
            player.initializeHitCounts();
            session.getPlayers().add(player);
            playerNumber++;
        }
        
        return gameSessionRepository.save(session);
    }
    
    /**
     * Process a hit and update game state.
     * 
     * @return Updated game state
     */
    public GameStateResponse recordHit(HitRequest hitRequest) {
        GameSession session = gameSessionRepository.findById(hitRequest.getGameSessionId())
            .orElseThrow(() -> new IllegalArgumentException("Game session not found"));
        
        Player currentPlayer = session.getPlayers().stream()
            .filter(p -> p.getId().equals(hitRequest.getPlayerId()))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Player not found"));
        
        // Validate that it's this player's turn
        Player expectedCurrentPlayer = session.getPlayers().get(session.getCurrentPlayerIndex());
        if (!expectedCurrentPlayer.getId().equals(currentPlayer.getId())) {
            throw new IllegalArgumentException("It is not this player's turn");
        }
        
        // Validate hit value
        if (hitRequest.getHitValue() < 1 || hitRequest.getHitValue() > 3) {
            throw new IllegalArgumentException("Hit value must be 1 (single), 2 (double), or 3 (triple)");
        }
        
        // Validate target number
        int[] validNumbers = {15, 16, 17, 18, 19, 20, 25};
        boolean validNumber = false;
        for (int num : validNumbers) {
            if (num == hitRequest.getTargetNumber()) {
                validNumber = true;
                break;
            }
        }
        if (!validNumber) {
            throw new IllegalArgumentException("Invalid target number. Must be 15-20 or 25 (Bullseye)");
        }
        
        // Process the hit
        processHit(currentPlayer, hitRequest.getTargetNumber(), hitRequest.getHitValue(), session);
        
        // Increment dart counter
        session.setDartsThisRound(session.getDartsThisRound() + 1);
        
        // If player has thrown 3 darts, rotate to next player
        if (session.getDartsThisRound() >= 3) {
            session.setCurrentPlayerIndex((session.getCurrentPlayerIndex() + 1) % session.getPlayers().size());
            session.setDartsThisRound(0);
        }
        
        // Check win condition
        checkWinCondition(session);
        
        // Save and return updated state
        gameSessionRepository.save(session);
        return GameStateResponse.fromGameSession(session);
    }
    
    /**
     * Process a single hit for the current player.
     */
    private void processHit(Player player, int targetNumber, int hitValue, GameSession session) {
        // Get current hit count
        int currentHits = player.getHitCount(targetNumber);

        // If already closed, any hit value scores points (if opponents haven't closed)
        if (currentHits >= 3) {
            scorePointsIfOpponentNotClosed(player, targetNumber, hitValue, session);
            return;
        }

        // Otherwise, add hits and handle overflow into scoring
        int totalHits = currentHits + hitValue;
        int newHits = Math.min(totalHits, 3);
        int overflow = Math.max(0, totalHits - 3);

        player.getHitCounts().put(targetNumber, newHits);

        // If there was overflow (e.g., single + triple => overflow 1), award points for overflow
        if (overflow > 0) {
            scorePointsIfOpponentNotClosed(player, targetNumber, overflow, session);
        }

        // If we just closed it, update player's closed flag
        if (newHits == 3) {
            player.setAllClosed(player.checkAllNumbersClosed());
        }
    }
    
    /**
     * Award points if opponent hasn't closed the number.
     */
    private void scorePointsIfOpponentNotClosed(Player player, int targetNumber, int hitValue, GameSession session) {
        // Check if all opponents have closed this number
        boolean allOpponentsClosed = true;
        for (Player other : session.getPlayers()) {
            if (!other.getId().equals(player.getId()) && !other.isNumberClosed(targetNumber)) {
                allOpponentsClosed = false;
                break;
            }
        }
        
        // If at least one opponent hasn't closed, award points
        if (!allOpponentsClosed) {
            player.setScore(player.getScore() + (targetNumber * hitValue));
        }
    }
    
    /**
     * Check if the game should end (player has closed all and highest score).
     */
    private void checkWinCondition(GameSession session) {
        Long winnerId = evaluateWinner(session);
        if (winnerId != null) {
            session.setStatus(GameStatus.COMPLETED);
            session.setWinnerId(winnerId);
        }
    }

    /**
     * Evaluate the provided GameSession and determine if there is a winner.
     * A winner must have all cricket numbers closed and a score greater than or
     * equal to every other player's score.
     *
     * @param session the game session to evaluate
     * @return the playerId of the winner if found, otherwise null
     */
    public Long evaluateWinner(GameSession session) {
        if (session == null) return null;

        for (Player candidate : session.getPlayers()) {
            if (!candidate.checkAllNumbersClosed()) continue; // must have all closed

            boolean hasHighestOrTied = true;
            for (Player other : session.getPlayers()) {
                if (other.getId().equals(candidate.getId())) continue;
                if (other.getScore() > candidate.getScore()) {
                    hasHighestOrTied = false;
                    break;
                }
            }

            if (hasHighestOrTied) {
                return candidate.getId();
            }
        }
        return null;
    }
    
    /**
     * Get current game state.
     */
    public GameStateResponse getGameState(Long gameSessionId) {
        GameSession session = gameSessionRepository.findById(gameSessionId)
            .orElseThrow(() -> new IllegalArgumentException("Game session not found"));
        return GameStateResponse.fromGameSession(session);
    }

    /**
     * Record a miss (dart that scored no points) and advance the dart counter.
     * If this is the player's 3rd dart, rotate to the next player.
     * 
     * @param gameSessionId ID of the game session
     * @param playerId ID of the player recording the miss
     * @return Updated game state
     */
    public GameStateResponse recordMiss(Long gameSessionId, Long playerId) {
        GameSession session = gameSessionRepository.findById(gameSessionId)
            .orElseThrow(() -> new IllegalArgumentException("Game session not found"));

        Player currentPlayer = session.getPlayers().stream()
            .filter(p -> p.getId().equals(playerId))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Player not found"));

        // Validate that it's this player's turn
        Player expectedCurrentPlayer = session.getPlayers().get(session.getCurrentPlayerIndex());
        if (!expectedCurrentPlayer.getId().equals(currentPlayer.getId())) {
            throw new IllegalArgumentException("It is not this player's turn");
        }

        // Increment dart counter
        session.setDartsThisRound(session.getDartsThisRound() + 1);

        // If player has thrown 3 darts, rotate to next player
        if (session.getDartsThisRound() >= 3) {
            session.setCurrentPlayerIndex((session.getCurrentPlayerIndex() + 1) % session.getPlayers().size());
            session.setDartsThisRound(0);
        }

        // Check win condition
        checkWinCondition(session);

        // Save and return updated state
        gameSessionRepository.save(session);
        return GameStateResponse.fromGameSession(session);
    }

    /**
     * Skip the current player's remaining darts and immediately move to the next player.
     * 
     * @param gameSessionId ID of the game session
     * @param playerId ID of the player skipping
     * @return Updated game state
     */
    public GameStateResponse skipToNextPlayer(Long gameSessionId, Long playerId) {
        GameSession session = gameSessionRepository.findById(gameSessionId)
            .orElseThrow(() -> new IllegalArgumentException("Game session not found"));

        Player currentPlayer = session.getPlayers().stream()
            .filter(p -> p.getId().equals(playerId))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Player not found"));

        // Validate that it's this player's turn
        Player expectedCurrentPlayer = session.getPlayers().get(session.getCurrentPlayerIndex());
        if (!expectedCurrentPlayer.getId().equals(currentPlayer.getId())) {
            throw new IllegalArgumentException("It is not this player's turn");
        }

        // Move to next player
        session.setCurrentPlayerIndex((session.getCurrentPlayerIndex() + 1) % session.getPlayers().size());
        session.setDartsThisRound(0);

        // Check win condition
        checkWinCondition(session);

        // Save and return updated state
        gameSessionRepository.save(session);
        return GameStateResponse.fromGameSession(session);
    }

    /**
     * Change whose turn it is to a specific player.
     * 
     * @param gameSessionId ID of the game session
     * @param playerId ID of the player to set as current
     * @return Updated game state
     */
    public GameStateResponse setPlayerTurn(Long gameSessionId, Long playerId) {
        GameSession session = gameSessionRepository.findById(gameSessionId)
            .orElseThrow(() -> new IllegalArgumentException("Game session not found"));

        Player targetPlayer = session.getPlayers().stream()
            .filter(p -> p.getId().equals(playerId))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Player not found"));

        // Find the index of the target player
        int newIndex = session.getPlayers().indexOf(targetPlayer);
        session.setCurrentPlayerIndex(newIndex);
        session.setDartsThisRound(0);

        // Save and return updated state
        gameSessionRepository.save(session);
        return GameStateResponse.fromGameSession(session);
    }

    /**
     * Undo the previous score on a specific target number.
     * Restores the player's score and hit count to the previous state.
     * 
     * @param gameSessionId ID of the game session
     * @param playerId ID of the player
     * @param targetNumber The target number to undo scoring from
     * @param previousScore The score before the hit was recorded
     * @param previousHitCount The hit count before the hit was recorded
     * @return Updated game state
     */
    public GameStateResponse removeHit(Long gameSessionId, Long playerId, Integer targetNumber, 
                                       Integer previousScore, Integer previousHitCount) {
        GameSession session = gameSessionRepository.findById(gameSessionId)
            .orElseThrow(() -> new IllegalArgumentException("Game session not found"));

        Player player = session.getPlayers().stream()
            .filter(p -> p.getId().equals(playerId))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Player not found"));

        // Only current player can undo scoring
        Player currentPlayer = session.getPlayers().get(session.getCurrentPlayerIndex());
        if (!currentPlayer.getId().equals(player.getId())) {
            throw new IllegalArgumentException("Only the current player can undo scoring");
        }

        // Restore to the previous state
        if (previousScore != null) {
            player.setScore(previousScore);
        }
        if (previousHitCount != null) {
            player.getHitCounts().put(targetNumber, previousHitCount);
        }
        
        // Also decrement the dart counter (undo the dart)
        if (session.getDartsThisRound() > 0) {
            session.setDartsThisRound(session.getDartsThisRound() - 1);
        }

        // Save and return updated state
        gameSessionRepository.save(session);
        return GameStateResponse.fromGameSession(session);
    }
}
