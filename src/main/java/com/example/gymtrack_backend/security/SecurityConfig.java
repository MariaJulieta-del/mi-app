package com.example.gymtrack_backend.security;

import org.springframework.security.authorization.AuthenticatedAuthorizationManager;
import org.springframework.security.authorization.AuthorityAuthorizationManager;
import org.springframework.security.authorization.AuthorizationManagers;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Configuración central de Spring Security.
 *
 * Reglas:
 *  - /api/v1/auth/** → público (login, registro)
 *  - Todo lo demás  → requiere JWT válido
 *  - CSRF deshabilitado (API REST stateless)
 *  - Sesión STATELESS (el estado vive en el token)
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity        // habilita @PreAuthorize en controllers
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserDetailsService      userDetailsService;

    @org.springframework.beans.factory.annotation.Value("${app.cors.allowed-origins}")
    private String corsOrigins;

    // ── SecurityFilterChain ──────────────────────────────────────────────────
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(sess ->
                    sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                    // Endpoints públicos
                    .requestMatchers("/api/v1/auth/**").permitAll()
                    // Solo ADMIN puede registrar nuevos usuarios
                    .requestMatchers(HttpMethod.POST, "/api/v1/auth/register").hasRole("ADMIN")
                    // Profesores: solo ADMIN
                    .requestMatchers("/api/v1/profesores", "/api/v1/profesores/**").hasRole("ADMIN")
                    // Pantalla de recepción (ROLE_KIOSCO): solo el QR vigente y los últimos ingresos
                    .requestMatchers(HttpMethod.GET, "/api/v1/asistencias/qr-actual", "/api/v1/kiosco/ultimos").authenticated()
                    // Salud del servicio (lo consulta Render)
                    .requestMatchers(HttpMethod.GET, "/api/v1/salud").permitAll()
                    // El resto requiere un usuario autenticado que NO sea una pantalla de recepción
                    .anyRequest().access(AuthorizationManagers.allOf(
                            AuthenticatedAuthorizationManager.authenticated(),
                            AuthorizationManagers.not(AuthorityAuthorizationManager.hasRole("KIOSCO"))))
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // ── CORS ─────────────────────────────────────────────────────────────────
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        // Solo los orígenes del frontend (CORS_ORIGINS, separados por coma)
        config.setAllowedOrigins(java.util.Arrays.stream(corsOrigins.split(","))
                .map(String::trim).filter(o -> !o.isEmpty()).toList());
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Socio-Id"));
        // El token viaja en el header Authorization, no en cookies
        config.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    // ── Beans de autenticación ───────────────────────────────────────────────
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager() {
        return new ProviderManager(authenticationProvider());
    }
}
