package vttp.batch5.paf.finalproject.server.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import vttp.batch5.paf.finalproject.server.services.SpotifyService;

import java.util.Map;

@Controller
@RequestMapping("/api/spotify")
public class SpotifyController {

    @Autowired
    private SpotifyService spotifyService;

    @GetMapping("/auth-url")
    @ResponseBody
    public ResponseEntity<Map<String, String>> getAuthUrl() {
        String authUrl = spotifyService.getAuthorizationUrl();
        return ResponseEntity.ok(Map.of("url", authUrl));
    }

    @PostMapping("/token")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getToken(@RequestBody Map<String, String> payload) {
        String code = payload.get("code");
        Map<String, Object> tokenResponse = spotifyService.getAccessToken(code);
        return ResponseEntity.ok(tokenResponse);
    }

    @GetMapping("/search")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> searchTracks(
            @RequestParam String query,
            @RequestParam String token) {

        try {
            System.out.println("Processing Spotify search for: " + query);
            Map<String, Object> results = spotifyService.searchTracks(query, token);
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("Spotify search error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/track/{id}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getTrack(
            @PathVariable String id,
            @RequestParam String token,
            Authentication authentication) {

        Map<String, Object> track = spotifyService.getTrack(id, token);
        return ResponseEntity.ok(track);
    }

    @PostMapping("/refresh-token")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> refreshToken(@RequestBody Map<String, String> payload) {
        String refreshToken = payload.get("refresh_token");
        if (refreshToken == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Refresh token is required"));
        }

        Map<String, Object> tokenResponse = spotifyService.refreshAccessToken(refreshToken);
        return ResponseEntity.ok(tokenResponse);
    }

}
