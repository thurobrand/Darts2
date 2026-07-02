package com.darts.cricket.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.HashMap;
import java.util.Map;

/**
 * Represents a player in a Cricket Darts game.
 * 
 * The game requires hitting 15, 16, 17, 18, 19, 20, and Bullseye (25).
 * Each number must be hit 3 times to be "closed".
 * - Single hit = 1 hit
 * - Double hit = 2 hits
 * - Triple hit = 3 hits (immediate close)
 */
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Player {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_session_id")
    private GameSession gameSession;
    
    private String name;
    private int playerNumber; // 1, 2, 3, etc.
    
    // Track hits for each cricket number (15-20, 25=Bullseye)
    @ElementCollection(fetch = FetchType.EAGER)
    private Map<Integer, Integer> hitCounts = new HashMap<>(); // Number -> Hit Count (0-3)
    
    // Track points earned when opponent hasn't closed
    private int score;
    
    // Track if player has closed all numbers (15-20 + Bullseye)
    private boolean allClosed;
    
    @PostLoad
    @PostPersist
    public void initializeHitCounts() {
        if (hitCounts.isEmpty()) {
            // Initialize hit counts for cricket numbers
            for (int num : new int[]{15, 16, 17, 18, 19, 20, 25}) {
                hitCounts.put(num, 0);
            }
        }
    }
    
    /**
     * Get the status of whether a specific number is closed for this player.
     * A number is closed when hit count reaches 3.
     */
    public boolean isNumberClosed(int number) {
        return hitCounts.getOrDefault(number, 0) >= 3;
    }
    
    /**
     * Get current hit count for a number.
     */
    public int getHitCount(int number) {
        return hitCounts.getOrDefault(number, 0);
    }
    
    /**
     * Check if all cricket numbers (15-20, Bullseye) are closed.
     */
    public boolean checkAllNumbersClosed() {
        for (int num : new int[]{15, 16, 17, 18, 19, 20, 25}) {
            if (!isNumberClosed(num)) {
                return false;
            }
        }
        return true;
    }
}
