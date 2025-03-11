package vttp.batch5.paf.finalproject.server.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import vttp.batch5.paf.finalproject.server.models.UserProfile;
import vttp.batch5.paf.finalproject.server.repositories.mysql.UserProfileRepository;

@Service
public class UserProfileService {

    @Autowired
    private UserProfileRepository userProfileRepo;

    // Create a user profile
    public boolean createProfile(UserProfile profile) {
        return userProfileRepo.createProfile(profile);
    }

    // Get a user profile
    public UserProfile getProfile(String email) {
        return userProfileRepo.getProfile(email);
    }

    // Update a user profile
    public boolean updateProfile(UserProfile profile) {
        UserProfile existingProfile = getProfile(profile.getEmail());

        if (existingProfile == null) {
            // Profile doesn't exist, create it
            return createProfile(profile);
        } else {
            // Profile exists, update it
            return userProfileRepo.updateProfile(profile);
        }
    }

}
