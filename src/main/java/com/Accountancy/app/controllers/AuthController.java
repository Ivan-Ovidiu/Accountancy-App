package com.Accountancy.app.controllers;

import com.Accountancy.app.dto.AuthResponse;
import com.Accountancy.app.dto.LoginRequest;
import com.Accountancy.app.dto.RegisterRequest;
import com.Accountancy.app.entities.User;
import com.Accountancy.app.repositories.UserRepository;
import com.Accountancy.app.security.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearerAuth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthController(AuthenticationManager authenticationManager,
                          UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtUtil jwtUtil) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    // POST /api/auth/login
    // Body: { "email": "admin@accountancy.local", "password": "Admin@123" }
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            // 1. Verify credentials — throws exception if wrong
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password())
            );

            // 2. Load user from DB
            User user = userRepository.findByEmail(request.email())
                    .orElseThrow();

            // 3. Generate JWT token
            String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

            // 4. Return token + user info
            return ResponseEntity.ok(new AuthResponse(
                    token,
                    user.getEmail(),
                    user.getName(),
                    user.getRole().name()
            ));

        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid email or password");
        }
    }

    // POST /api/auth/register
    // Body: { "name": "Ion Popescu", "email": "ion@firma.ro", "password": "Parola123" }
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        // 1. Check if email already exists
        if (userRepository.existsByEmail(request.email())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Email already in use");
        }

        // 2. Create new user with hashed password
        User user = User.builder()
                .name(request.name())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(User.Role.VIEWER) // new users get VIEWER role by default
                .isActive(true)
                .build();

        userRepository.save(user);

        // 3. Generate token so they're logged in immediately after register
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

        return ResponseEntity.status(HttpStatus.CREATED).body(new AuthResponse(
                token,
                user.getEmail(),
                user.getName(),
                user.getRole().name()
        ));
    }

    // GET /api/auth/me  — returns current logged-in user info
    // Requires: Authorization: Bearer <token>
    @GetMapping("/me")
    public ResponseEntity<?> me(@org.springframework.security.core.annotation.AuthenticationPrincipal
                                org.springframework.security.core.userdetails.UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow();

        return ResponseEntity.ok(new AuthResponse(
                null, // don't re-send token
                user.getEmail(),
                user.getName(),
                user.getRole().name()
        ));
    }
}