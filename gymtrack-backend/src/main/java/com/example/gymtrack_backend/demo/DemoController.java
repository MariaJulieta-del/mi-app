package com.example.gymtrack_backend.demo;

import com.example.gymtrack_backend.dto.LoginResponseDTO;
import com.example.gymtrack_backend.entities.Usuario;
import com.example.gymtrack_backend.entities.enums.Rol;
import com.example.gymtrack_backend.repository.SocioRepository;
import com.example.gymtrack_backend.repository.UsuarioRepository;
import com.example.gymtrack_backend.security.JwtUtil;
import com.example.gymtrack_backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

/**
 * Entrada a la demo sin contraseña: devuelve una sesión de un usuario de prueba según el rol elegido.
 * Fuera del modo demo responde 404, como si no existiera.
 */
@RestController
@RequestMapping("/api/v1/auth/demo")
@RequiredArgsConstructor
public class DemoController {

    private final DemoConfig demo;
    private final UsuarioRepository usuarios;
    private final SocioRepository socios;
    private final JwtUtil jwtUtil;
    private final AuthService authService;

    @PostMapping
    public ResponseEntity<?> entrar(@RequestBody(required = false) Map<String, String> body) {
        if (!demo.habilitada()) return ResponseEntity.notFound().build();
        String rol = body == null ? "ADMIN" : body.getOrDefault("rol", "ADMIN").toUpperCase();

        if ("SOCIO".equals(rol)) {
            Optional<Usuario> u = socios.findByDni(demo.dniSocio()).flatMap(s -> usuarios.findBySocioId(s.getId()));
            return u.<ResponseEntity<?>>map(x -> ResponseEntity.ok(authService.tokenSocio(x))).orElseGet(DemoController::noDisponible);
        }
        String username = "PROFESOR".equals(rol) ? demo.usuarioProfesor() : demo.usuarioAdmin();
        Rol esperado = "PROFESOR".equals(rol) ? Rol.PROFESOR : Rol.ADMIN;
        return usuarios.findByUsername(username)
                .filter(x -> x.getRol() == esperado && x.isEnabled())
                .<ResponseEntity<?>>map(x -> ResponseEntity.ok(new LoginResponseDTO(
                        jwtUtil.generateToken(x, x.getRol().name()), x.getUsername(), x.getRol().name(), null)))
                .orElseGet(DemoController::noDisponible);
    }

    private static ResponseEntity<?> noDisponible() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("error", "La demo se está preparando. Probá de nuevo en un minuto."));
    }
}
