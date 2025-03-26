package vttp.batch5.paf.finalproject.server.repositories.mysql;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import vttp.batch5.paf.finalproject.server.models.UserProfile;

@Repository
public class UserProfileRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final String INSERT_PROFILE = "INSERT INTO user_profiles (email, name, age, height, weight, fitness_goals, profile_picture_url) VALUES (?, ?, ?, ?, ?, ?, ?)";
    private final String SELECT_PROFILE = "SELECT * FROM user_profiles WHERE email = ?";
    private final String UPDATE_PROFILE = "UPDATE user_profiles SET name = ?, age = ?, height = ?, weight = ?, fitness_goals = ?, profile_picture_url = ? WHERE email = ?";

    // Create a new user profile
    public boolean createProfile(UserProfile profile) {
        try {
            int rows = jdbcTemplate.update(INSERT_PROFILE,
                    profile.getEmail(),
                    profile.getName(),
                    profile.getAge(),
                    profile.getHeight(),
                    profile.getWeight(),
                    profile.getFitnessGoals(),
                    profile.getProfilePictureUrl());
            return rows > 0;
        } catch (Exception e) {
            return false;
        }
    }

    // Get a user profile
    public UserProfile getProfile(String email) {
        try {
            return jdbcTemplate.queryForObject(SELECT_PROFILE, (rs, rowNum) -> {
                UserProfile profile = new UserProfile();
                profile.setEmail(rs.getString("email"));
                profile.setName(rs.getString("name"));
                profile.setAge(rs.getInt("age"));
                profile.setHeight(rs.getDouble("height"));
                profile.setWeight(rs.getDouble("weight"));
                profile.setFitnessGoals(rs.getString("fitness_goals"));
                profile.setProfilePictureUrl(rs.getString("profile_picture_url"));
                return profile;
            }, email);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    // Update a user profile
    public boolean updateProfile(UserProfile profile) {
        try {
            int rows = jdbcTemplate.update(UPDATE_PROFILE,
                    profile.getName(),
                    profile.getAge(),
                    profile.getHeight(),
                    profile.getWeight(),
                    profile.getFitnessGoals(),
                    profile.getProfilePictureUrl(),
                    profile.getEmail());
            return rows > 0;
        } catch (Exception e) {
            return false;
        }
    }

}
