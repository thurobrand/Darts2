package com.darts.cricket.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for recording a hit in the game.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HitRequest {
    private Long gameSessionId;
    private Long playerId;
    private int targetNumber; // 15-20 or 25 (Bullseye)
    private int hitValue; // 1 (single), 2 (double), 3 (triple)
}
