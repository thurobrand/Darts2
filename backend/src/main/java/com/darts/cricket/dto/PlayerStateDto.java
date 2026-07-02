package com.darts.cricket.dto;

import com.darts.cricket.model.Player;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.HashMap;
import java.util.Map;

/**
 * DTO representing the state of a player in the game.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlayerStateDto {
    private Long id;
    private String name;
    private int playerNumber;
    private Map<Integer, Integer> hitCounts;
    private int score;
    private boolean allClosed;
    
    public static PlayerStateDto fromPlayer(Player player) {
        return PlayerStateDto.builder()
            .id(player.getId())
            .name(player.getName())
            .playerNumber(player.getPlayerNumber())
            .hitCounts(new HashMap<>(player.getHitCounts()))
            .score(player.getScore())
            .allClosed(player.isAllClosed())
            .build();
    }
}
