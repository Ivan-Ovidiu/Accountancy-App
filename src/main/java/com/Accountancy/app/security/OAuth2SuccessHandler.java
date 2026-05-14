package com.Accountancy.app.security;

import com.Accountancy.app.entities.User;
import com.Accountancy.app.repositories.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.UUID;

/**
 * After Google OAuth2 succeeds, we issue a pre-auth token (NOT a final
 * token) and redirect to the frontend's /select-company route. There the
 * user picks one of the companies they have access to, the frontend calls
 * /api/auth/select-company, and only then receives a usable final token.
 *
 * For a brand-new OAuth2 user, the company list will be empty — the
 * frontend should show "No company access — contact your administrator".
 */
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    // Instantiate directly to break the circular dependency with SecurityConfig
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email = oAuth2User.getAttribute("email");
        String name  = oAuth2User.getAttribute("name");

        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setName(name != null ? name : email.split("@")[0]);
            newUser.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
            newUser.setRole(User.Role.VIEWER);
            newUser.setIsActive(true);
            return userRepository.save(newUser);
        });

        // Issue a PRE-AUTH token only — the frontend will call
        // /api/auth/select-company to obtain the final usable token.
        String preAuthToken = jwtUtil.generatePreAuthToken(
                user.getEmail(), user.getRole().name());

        String redirectUrl = frontendUrl + "/select-company"
                + "?preAuthToken=" + preAuthToken
                + "&email=" + encode(user.getEmail())
                + "&name="  + encode(user.getName())
                + "&role="  + user.getRole().name();

        response.sendRedirect(redirectUrl);
    }

    private String encode(String value) {
        try {
            return java.net.URLEncoder.encode(value, "UTF-8");
        } catch (Exception e) {
            return value;
        }
    }
}