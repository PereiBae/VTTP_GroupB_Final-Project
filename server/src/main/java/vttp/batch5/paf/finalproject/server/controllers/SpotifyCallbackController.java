package vttp.batch5.paf.finalproject.server.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.view.RedirectView;
import vttp.batch5.paf.finalproject.server.services.SpotifyService;

@Controller
@RequestMapping("/callback")
public class SpotifyCallbackController {

    @Autowired
    private SpotifyService spotifyService;

    @GetMapping
    public RedirectView handleSpotifyCallback(@RequestParam(value = "code", required = false) String code,
                                              @RequestParam(value = "error", required = false) String error) {
        // If there was an error in the authorization
        if (error != null) {
            System.err.println("Spotify authorization error: " + error);
            return new RedirectView("/#/spotify-callback?error=" + error);
        }

        // If no code was provided
        if (code == null || code.isEmpty()) {
            System.err.println("No code provided in Spotify callback");
            return new RedirectView("/#/spotify-callback?error=no_code");
        }

        // Log the successful receipt of authorization code
        System.out.println("Received Spotify authorization code: " + code.substring(0, 5) + "...");

        // Redirect to the Angular app with the code as a query parameter
        // The Angular app will handle exchanging this code for a token
        return new RedirectView("/#/spotify-callback?code=" + code);
    }

}
