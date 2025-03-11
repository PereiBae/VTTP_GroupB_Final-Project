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

    @PostMapping(path = "/auth/login", consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> createAuthenticationToken(@RequestBody AuthenticationRequest authRequest) throws Exception {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(authRequest.getEmail(), authRequest.getPassword())
            );
        } catch (BadCredentialsException e) {
            throw new Exception("Incorrect email or password", e);
        }

        final UserDetails userDetails = myUserDetailsService.loadUserByUsername(authRequest.getEmail());
        final String jwt = jwtUtil.generateToken(userDetails);

        return ResponseEntity.ok(new AuthenticationResponse(jwt));
    }

    @PostMapping(path = "/auth/register", consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> register(@RequestBody RegistrationRequest request){
        try {
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
