package com.darts.cricket.service;

import com.darts.cricket.dto.HitRequest;
import com.darts.cricket.model.GameSession;
import com.darts.cricket.model.Player;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

/**
 * Service that applies cricket scoring rules to a GameSession.
 *
 * This class updates the provided {@link GameSession} in-memory state based on the
 * incoming {@link HitRequest}. It does NOT persist the session; callers should
 * save the repository state after calling these methods.
 */
@Service
@Transactional
public class CricketScoringService {

    private static final List<Integer> VALID_NUMBERS = Arrays.asList(15, 16, 17, 18, 19, 20, 25);

    /**
     * Apply a hit to the given game session according to Cricket rules.
     *
     * Rules implemented:
     * - Each number is closed at 3 hits (single=1,double=2,triple=3)
     * - If player hits beyond closing (overflow), any overflow counts as points
     *   only when at least one opponent has not closed that number.
     * - If the number is already closed by all players, no points are awarded
     *   and hit counts are not increased.
     *
     * @param session the game session to update (in-memory)
     * @param request the hit request containing playerId, targetNumber and hitValue
     */
    public void applyHit(GameSession session, HitRequest request) {
        if (session == null) throw new IllegalArgumentException("GameSession cannot be null");

        Long playerId = request.getPlayerId();
        int target = request.getTargetNumber();
        int multiplier = request.getHitValue();

        if (!VALID_NUMBERS.contains(target)) {
            throw new IllegalArgumentException("Invalid target number: " + target);
        }
        if (multiplier < 1 || multiplier > 3) {
            throw new IllegalArgumentException("Invalid hit value (must be 1-3): " + multiplier);
        }

        Player player = session.getPlayers().stream()
                .filter(p -> p.getId().equals(playerId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Player not found: " + playerId));

        // Ensure hitCounts initialized
        player.initializeHitCounts();

        // If number already closed by all players, do nothing
        if (isNumberClosedByAll(session, target)) {
            return;
        }

        int currentHits = player.getHitCount(target);

        // If player already closed the number, award points only if opponents haven't closed
        if (currentHits >= 3) {
            if (!isNumberClosedByAll(session, target)) {
                int points = target * multiplier;
                player.setScore(player.getScore() + points);
            }
            // nothing else to do
            updatePlayerClosedFlag(player);
            return;
        }

        // Add hits, handle overflow into scoring
        int totalHits = currentHits + multiplier;
        int newHits = Math.min(3, totalHits);
        int overflow = Math.max(0, totalHits - 3);

        player.getHitCounts().put(target, newHits);

        // If there is overflow, award points only if at least one opponent hasn't closed
        if (overflow > 0 && !isNumberClosedByAll(session, target)) {
            int points = overflow * target;
            player.setScore(player.getScore() + points);
        }

        updatePlayerClosedFlag(player);
    }

    /**
     * Returns true if every player in the session has closed the given number.
     */
    public boolean isNumberClosedByAll(GameSession session, int number) {
        return session.getPlayers().stream().allMatch(p -> p.isNumberClosed(number));
    }

    private void updatePlayerClosedFlag(Player player) {
        player.setAllClosed(player.checkAllNumbersClosed());
    }
}
