package vttp.batch5.paf.finalproject.server.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import vttp.batch5.paf.finalproject.server.models.UserProfile;
import vttp.batch5.paf.finalproject.server.services.UserProfileService;

@Controller
@RequestMapping("/api/profile")
public class UserProfileController {

    @Autowired
    private UserProfileService userProfileSvc;

    // Get user profile
    @GetMapping
    public ResponseEntity<UserProfile> getUserProfile(Authentication authentication) {
        UserProfile profile = userProfileSvc.getProfile(authentication.getName());

        if (profile == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(profile);
    }

    // Create or update user profile
    @PostMapping
    public ResponseEntity<UserProfile> saveUserProfile(
            @RequestBody UserProfile profile,
            Authentication authentication) {

        // Ensure the profile is for the authenticated user
        profile.setEmail(authentication.getName());

        boolean saved = userProfileSvc.updateProfile(profile);

        if (saved) {
            UserProfile updatedProfile = userProfileSvc.getProfile(authentication.getName());
            return ResponseEntity.ok(updatedProfile);
        } else {
            return ResponseEntity.badRequest().build();
        }
    }

}
