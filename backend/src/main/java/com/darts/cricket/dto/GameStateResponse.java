package com.darts.cricket.dto;

import com.darts.cricket.model.GameSession;
import com.darts.cricket.model.Player;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Response DTO for returning the current game state.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameStateResponse {
    private Long gameSessionId;
    private String sessionName;
    private String status;
    private Long winnerId;
    private List<PlayerStateDto> players;
    private int currentPlayerIndex;
    private int dartsThisRound;
    
    public static GameStateResponse fromGameSession(GameSession session) {
        return GameStateResponse.builder()
            .gameSessionId(session.getId())
            .sessionName(session.getSessionName())
            .status(session.getStatus().toString())
            .winnerId(session.getWinnerId())
            .currentPlayerIndex(session.getCurrentPlayerIndex())
            .dartsThisRound(session.getDartsThisRound())
            .players(session.getPlayers().stream()
                .map(PlayerStateDto::fromPlayer)
                .collect(Collectors.toList()))
            .build();
    }
}
