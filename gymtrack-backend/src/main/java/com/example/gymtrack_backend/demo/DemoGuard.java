package com.example.gymtrack_backend.demo;

import com.example.gymtrack_backend.repository.SocioRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * En la demo pública bloquea lo que la rompería para el próximo visitante:
 * contraseñas, PIN, usuarios del personal y borrar o dar de baja al socio con el que se entra.
 * (No hay restauración de copias ni funciones pagas como IA en el sistema.)
 */
@Configuration
@RequiredArgsConstructor
public class DemoGuard implements WebMvcConfigurer, HandlerInterceptor {

    private final DemoConfig demo;
    private final SocioRepository socios;

    private record Regla(String metodo, Pattern ruta) {}

    private static Regla r(String metodo, String ruta) {
        return new Regla(metodo, Pattern.compile("^/api/v1" + ruta + "$"));
    }

    private static final List<Regla> BLOQUEADAS = List.of(
            // En la demo se entra solo por /auth/demo (cada visitante con su copia): el login común no aplica
            r("POST", "/auth/login"),
            r("POST", "/auth/login-socio"),
            r("POST", "/auth/cambiar-password"),
            r("POST", "/auth/cambiar-pin"),
            r("POST", "/auth/register"),
            r("POST", "/auth/pines-pendientes"),
            r("POST", "/socios/\\d+/pin"),
            r("POST", "/profesores"), r("PUT", "/profesores/.*"), r("PATCH", "/profesores/.*"), r("DELETE", "/profesores/.*")
    );
    /** Acciones sobre un socio: se bloquean solo para el socio de la demo */
    private static final Pattern SOCIO = Pattern.compile("^/api/v1/socios/(\\d+)(/baja|/permanente)?$");

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(this).addPathPatterns("/api/v1/**");
    }

    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object handler) throws Exception {
        if (!demo.habilitada()) return true;
        String metodo = req.getMethod(), ruta = req.getRequestURI();
        boolean bloquear = BLOQUEADAS.stream().anyMatch(x -> x.metodo().equals(metodo) && x.ruta().matcher(ruta).matches());
        if (!bloquear && ("DELETE".equals(metodo) || "PUT".equals(metodo))) {
            Matcher m = SOCIO.matcher(ruta);
            if (m.matches() && ("DELETE".equals(metodo) || "/baja".equals(m.group(2)))) {
                Long id = Long.valueOf(m.group(1));
                bloquear = socios.findByDni(demo.dniSocio()).map(s -> s.getId().equals(id)).orElse(false);
            }
        }
        if (!bloquear) return true;
        res.setStatus(HttpServletResponse.SC_FORBIDDEN);
        res.setContentType("application/json;charset=UTF-8");
        res.getWriter().write("{\"error\":\"En la demo esto está deshabilitado, así la puede probar todo el mundo.\"}");
        return false;
    }
}
