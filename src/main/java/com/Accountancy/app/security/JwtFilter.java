package com.Accountancy.app.security;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

@Component
public class JwtFilter extends OncePerRequestFilter {

    /**
     * Endpoints reachable with a pre-auth token (i.e. before a company
     * has been chosen). Anything else requires a final token.
     */
    private static final Set<String> PRE_AUTH_ALLOWED = Set.of(
            "/api/auth/select-company",
            "/api/auth/me",
            "/api/companies/mine"
    );

    private final JwtUtil jwtUtil;
    private final UserDetailsServiceImpl userDetailsService;
    private final CompanyContext companyContext;

    public JwtFilter(JwtUtil jwtUtil,
                     UserDetailsServiceImpl userDetailsService,
                     CompanyContext companyContext) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
        this.companyContext = companyContext;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        if (!jwtUtil.isTokenValid(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        String email      = jwtUtil.extractEmail(token);
        boolean preAuth   = jwtUtil.isPreAuthToken(token);
        Integer companyId = jwtUtil.extractCompanyId(token);

        // A pre-auth token can only reach a small whitelist of endpoints.
        // Final tokens (with companyId) can reach anything.
        if (preAuth && !isAllowedForPreAuth(request)) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"status\":403,\"error\":\"Forbidden\",\"message\":" +
                            "\"Company selection required. Use POST /api/auth/select-company first.\"}"
            );
            return;
        }

        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = userDetailsService.loadUserByUsername(email);

            UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            SecurityContextHolder.getContext().setAuthentication(authToken);

            // Make companyId available throughout the request lifecycle
            if (companyId != null) {
                companyContext.setCurrentCompanyId(companyId);
            }
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            // Always clean up ThreadLocal so it never leaks to another request
            companyContext.clear();
        }
    }

    private boolean isAllowedForPreAuth(HttpServletRequest request) {
        String path = request.getServletPath();
        for (String allowed : PRE_AUTH_ALLOWED) {
            if (path.equals(allowed) || path.startsWith(allowed + "/")) {
                return true;
            }
        }
        return false;
    }
}