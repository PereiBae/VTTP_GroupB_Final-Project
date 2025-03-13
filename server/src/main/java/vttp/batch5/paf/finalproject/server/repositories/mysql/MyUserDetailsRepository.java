package vttp.batch5.paf.finalproject.server.repositories.mysql;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import vttp.batch5.paf.finalproject.server.config.JWTUtil;

import java.util.ArrayList;
import java.util.List;

@Repository
public class MyUserDetailsRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private JWTUtil jwtUtil;

    private final String SELECT_USER="SELECT email, password, is_premium FROM users WHERE email = ?";
    private final String INSERT_USER = "INSERT INTO users (email, password) VALUES (?, ?)";
    private final String UPDATE_PREMIUM = "UPDATE users SET is_premium = ? WHERE email = ?";
    private final String CHECK_PREMIUM = "SELECT is_premium FROM users WHERE email = ?";

    @Transactional
    public boolean upgradeToPremium(String email) {
        // Update user's premium status in database
        int updated = jdbcTemplate.update(
                UPDATE_PREMIUM,
                email);

        return updated > 0;
    }

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

    public UserDetails getUserDetails(String email) {
        return jdbcTemplate.queryForObject(
                "SELECT email, password, is_premium FROM users WHERE email = ?",
                (rs, rowNum) -> {
                    List<GrantedAuthority> authorities = new ArrayList<>();
                    authorities.add(new SimpleGrantedAuthority("ROLE_USER"));

                    if (rs.getBoolean("is_premium")) {
                        authorities.add(new SimpleGrantedAuthority("ROLE_PREMIUM"));
                    }

                    return User.builder()
                            .username(rs.getString("email"))
                            .password(rs.getString("password"))
                            .authorities(authorities)
                            .build();
                },
                email);
    }

    public String generateNewToken(String email) {
        UserDetails userDetails = getUserDetails(email);
        return jwtUtil.generateToken(userDetails);
    }

    public boolean isPremiumUser(String email) {
        try {
            jdbcTemplate.queryForObject(
                    CHECK_PREMIUM,
                    Boolean.class,
                    email);
            return true;
        } catch (EmptyResultDataAccessException ex){
            return false;
        }
    }

}
