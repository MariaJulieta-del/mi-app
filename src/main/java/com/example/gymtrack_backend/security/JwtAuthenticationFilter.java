package com.example.gymtrack_backend.security;

import com.example.gymtrack_backend.repository.UsuarioRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtro JWT: intercepta cada request, extrae el Bearer token,
 * lo valida y carga el usuario en el SecurityContext.
 *
 * Middleware que se ejecuta una sola vez por request (OncePerRequestFilter).
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;
    private final UsuarioRepository  usuarioRepository;
    private final com.example.gymtrack_backend.kiosco.DispositivoKioscoRepository kioscoRepository;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest  request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain          filterChain
    ) throws ServletException, IOException {

        // 1. Leer el header Authorization
        final String authHeader = request.getHeader("Authorization");

        // 2. Si no hay Bearer token, continuar sin autenticar
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 3. Extraer token y username — con manejo explícito de JWT inválido/expirado
        final String jwt;
        final String username;
        try {
            jwt      = authHeader.substring(7);
            username = jwtUtil.extractUsername(jwt);
        } catch (JwtException | IllegalArgumentException ex) {
            // Token malformado, expirado o con firma inválida → 401 explícito
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"error\":\"Token inválido o expirado\"}");
            return;
        }

        // 4a. Pantalla de recepción: no es un usuario, solo puede ver el QR y los últimos ingresos
        if (username != null && username.startsWith(JwtUtil.PREFIJO_KIOSCO)) {
            if (!autenticarKiosco(username, request)) {
                rechazar(response, "Esta pantalla fue desvinculada. Pedile al admin un link nuevo.");
                return;
            }
            filterChain.doFilter(request, response);
            return;
        }

        // 4. Si hay username y el contexto no tiene autenticación previa
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails;
            try {
                userDetails = userDetailsService.loadUserByUsername(username);
            } catch (UsernameNotFoundException ex) {
                rechazar(response, "La cuenta ya no existe");
                return;
            }

            // Una cuenta desactivada (profesor dado de baja) o un socio dado de baja pierde
            // el acceso en el momento, aunque su token todavía no haya vencido
            boolean esSocio = userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_SOCIO"));
            if (!userDetails.isEnabled()
                    || (esSocio && !usuarioRepository.findSocioActivoByUsername(username).orElse(false))) {
                rechazar(response, "Tu cuenta está deshabilitada");
                return;
            }

            // Socio: los tokens emitidos antes de su PIN actual ya no valen (regeneró o cambió el PIN)
            if (esSocio && userDetails instanceof com.example.gymtrack_backend.entities.Usuario u) {
                java.time.LocalDateTime pin = u.getPinActualizado();
                java.util.Date emitido = jwtUtil.extractIssuedAt(jwt);
                if (pin == null || emitido == null || emitido.toInstant()
                        .isBefore(pin.withNano(0).atZone(java.time.ZoneId.systemDefault()).toInstant())) {
                    rechazar(response, "Tu sesión se cerró porque cambió tu PIN. Volvé a ingresar.");
                    return;
                }
            }

            // 5. Validar el token
            if (jwtUtil.isTokenValid(jwt, userDetails)) {
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities()
                        );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            } else {
                // Token válido en firma pero expirado según isTokenValid
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write("{\"error\":\"Token expirado\"}");
                return;
            }
        }

        // 6. Continuar con la cadena de filtros
        filterChain.doFilter(request, response);
    }

    private boolean autenticarKiosco(String subject, HttpServletRequest request) {
        Long id;
        try { id = Long.valueOf(subject.substring(JwtUtil.PREFIJO_KIOSCO.length())); }
        catch (NumberFormatException e) { return false; }
        var disp = kioscoRepository.findById(id).filter(com.example.gymtrack_backend.kiosco.DispositivoKiosco::isActivo).orElse(null);
        if (disp == null) return false;
        // Registro de uso (como mucho cada 5 minutos, para no escribir en cada refresco del QR)
        if (disp.getUltimoUso() == null || disp.getUltimoUso().isBefore(java.time.LocalDateTime.now().minusMinutes(5))) {
            disp.setUltimoUso(java.time.LocalDateTime.now());
            kioscoRepository.save(disp);
        }
        var auth = new UsernamePasswordAuthenticationToken(subject, null,
                java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_KIOSCO")));
        auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(auth);
        return true;
    }

    private void rechazar(HttpServletResponse response, String mensaje) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"error\":\"" + mensaje + "\"}");
    }
}
