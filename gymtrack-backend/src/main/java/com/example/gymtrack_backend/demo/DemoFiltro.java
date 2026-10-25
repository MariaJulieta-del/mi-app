package com.example.gymtrack_backend.demo;

import com.example.gymtrack_backend.security.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Demo pública: lee de la sesión qué copia de los datos usa el visitante y la deja puesta para todo el pedido.
 * Corre dentro de la cadena de seguridad (después de CORS y antes de validar la sesión, que ya consulta la base).
 * Una sesión sin copia, o cuya copia ya se borró, se rechaza: el visitante vuelve a la pantalla de entrada.
 */
@Component
public class DemoFiltro extends OncePerRequestFilter {

    private final DemoConfig demo;
    private final DemoEsquemas esquemas;
    private final JwtUtil jwt;

    public DemoFiltro(DemoConfig demo, DemoEsquemas esquemas, JwtUtil jwt) {
        this.demo = demo;
        this.esquemas = esquemas;
        this.jwt = jwt;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest req) {
        return !demo.habilitada();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) throws ServletException, IOException {
        String auth = req.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ") || "OPTIONS".equals(req.getMethod())) {
            chain.doFilter(req, res);
            return;
        }
        String esquema;
        try {
            esquema = jwt.extractClaim(auth.substring(7), c -> c.get(JwtUtil.CLAIM_DEMO, String.class));
        } catch (Exception ex) {
            // token inválido o vencido: lo rechaza la seguridad como siempre
            chain.doFilter(req, res);
            return;
        }
        if (!esquemas.existe(esquema)) {
            res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            res.setContentType("application/json;charset=UTF-8");
            res.getWriter().write("{\"error\":\"La demo se reinició: elegí de nuevo cómo querés entrar.\"}");
            return;
        }
        esquemas.tocar(esquema);
        DemoContexto.usar(esquema);
        try {
            chain.doFilter(req, res);
        } finally {
            DemoContexto.limpiar();
        }
    }

    /** Solo dentro de la cadena de seguridad: no se registra además como filtro suelto del servidor */
    @Bean
    static FilterRegistrationBean<DemoFiltro> demoFiltroSinRegistrar(DemoFiltro f) {
        FilterRegistrationBean<DemoFiltro> r = new FilterRegistrationBean<>(f);
        r.setEnabled(false);
        return r;
    }
}
