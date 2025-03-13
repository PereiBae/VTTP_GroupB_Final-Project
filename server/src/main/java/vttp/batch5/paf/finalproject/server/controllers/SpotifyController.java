package vttp.batch5.paf.finalproject.server.controllers;

import org.springframework.beans.factory.annotation.Autowired;
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
            @RequestParam String token,
            Authentication authentication) {

        Map<String, Object> searchResults = spotifyService.searchTracks(query, token);
        return ResponseEntity.ok(searchResults);
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

}
