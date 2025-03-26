package vttp.batch5.paf.finalproject.server.controllers;

import jakarta.json.Json;
import jakarta.json.JsonObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import vttp.batch5.paf.finalproject.server.config.JWTUtil;
import vttp.batch5.paf.finalproject.server.models.AuthenticationRequest;
import vttp.batch5.paf.finalproject.server.models.AuthenticationResponse;
import vttp.batch5.paf.finalproject.server.models.RegistrationRequest;
import vttp.batch5.paf.finalproject.server.services.MyUserDetailsService;

import java.util.Map;

@Controller
@RequestMapping("/api")
public class LoginController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JWTUtil jwtUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private MyUserDetailsService myUserDetailsService;

    // Handle user login and generate JWT token
    @PostMapping(path = "/auth/login", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> createAuthenticationToken(@RequestBody AuthenticationRequest authRequest) {
        System.out.println("is there anything here?" + authRequest.toString());
        try {
            // Authenticate user with Spring Security
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(authRequest.getEmail(), authRequest.getPassword())
            );
            System.out.println("In the Controller, verifying login for ...."+ authRequest.getEmail());

            // Only generate token if authentication succeeds
            final UserDetails userDetails = myUserDetailsService.loadUserByUsername(authRequest.getEmail());
            final String jwt = jwtUtil.generateToken(userDetails);

            System.out.println("Generated token: " + jwt);

            // Return response with explicit content type
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new AuthenticationResponse(jwt));

        } catch (BadCredentialsException e) {
            // Return 401 Unauthorized with error message
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Incorrect email or password"));
        } catch (Exception e) {
            // Log the exception for debugging
            e.printStackTrace();
            // Return 500 with error message
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "An error occurred during authentication"));
        }
    }

    // Handle user registration
    @PostMapping(path = "/auth/register", consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> register(@RequestBody RegistrationRequest request){
        try {
            // Check if user already exists
            myUserDetailsService.loadUserByUsername(request.getEmail());
            JsonObject payload = Json.createObjectBuilder()
                    .add("message", "User already exists")
                    .build();
            System.out.println("User already exists");
            return ResponseEntity.status(HttpStatus.CONFLICT).body(payload);
        } catch (UsernameNotFoundException ex) {
            // Good – user does not exist.
            System.out.println("User not found, registering user...");
        }

        // Hash the password and register the user.
        String encodedPassword = passwordEncoder.encode(request.getPassword());
        boolean success = myUserDetailsService.registerUser(request.getEmail(), encodedPassword);

        if (success) {
            System.out.println("User registered successfully");
            JsonObject payload = Json.createObjectBuilder()
                    .add("message", "User registered successfully")
                    .build();
            return ResponseEntity.ok().body(payload.toString());
        } else {
            System.out.println("User registration failed");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("User registration failed");
        }
    }

}
