package vttp.batch5.paf.finalproject.server.repositories;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Repository;

@Repository
public class MyUserDetailsRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final String SELECT_USER="SELECT email, password, is_premium FROM users WHERE email = ?";
    private final String INSERT_USER = "INSERT INTO users (email, password) VALUES (?, ?)";

    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        try {
            return jdbcTemplate.queryForObject(SELECT_USER, (rs, rowNum) -> {
                String email = rs.getString("email");
                String password = rs.getString("password");
                boolean isPremium = rs.getBoolean("is_premium");
                if (isPremium) {
                    return User.withUsername(email)
                            .password(password)
                            .authorities("ROLE_USER", "ROLE_PREMIUM")
                            .build();
                } else {
                    return User.withUsername(email)
                            .password(password)
                            .authorities("ROLE_USER")
                            .build();
                }
            }, username);
        }catch (EmptyResultDataAccessException ex){
            throw new UsernameNotFoundException("Username not found with email: " + username);
        }
    }

    public boolean createUser(String email, String encodedPassword) {
        try {
            int rows = jdbcTemplate.update(INSERT_USER, email, encodedPassword);
            return rows > 0;
        } catch (Exception e) {
            // Log the exception in a real-world application
            return false;
        }
    }

}
