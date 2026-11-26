package com.example.tpoDA.security;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        var context = SecurityContextHolder.getContext();
        if (context.getAuthentication() == null && header != null && header.startsWith("Bearer ")) {
            try {
                String email = jwtService.extractUsername(header.substring(7));
                UserDetails user = userDetailsService.loadUserByUsername(email);
                if (user.isEnabled()) {
                    var authentication = UsernamePasswordAuthenticationToken.authenticated(
                        user, null, user.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    context.setAuthentication(authentication);
                }
            } catch (JwtException | IllegalArgumentException | UsernameNotFoundException ignored) {
                // La cadena de seguridad aplica el acceso anónimo que corresponda a la ruta.
            }
        }
        chain.doFilter(request, response);
    }
}
