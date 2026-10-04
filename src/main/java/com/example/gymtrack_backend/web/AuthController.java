package com.example.gymtrack_backend.web;

import com.example.gymtrack_backend.security.LoginRateLimiter;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.AuthenticationException;

import com.example.gymtrack_backend.dto.LoginRequestDTO;
import com.example.gymtrack_backend.dto.LoginResponseDTO;
import com.example.gymtrack_backend.dto.RegisterRequestDTO;
import com.example.gymtrack_backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Endpoints de autenticación — todos públicos excepto /register.
 *
 * POST /api/v1/auth/login    → devuelve JWT + info del usuario
 * POST /api/v1/auth/register → crea usuario (solo ADMIN)
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final com.example.gymtrack_backend.service.PinService pinService;
    private final LoginRateLimiter rateLimiter;

    // ── Login staff (admin y profesor: un solo formulario, el rol lo decide el backend) ──
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequestDTO dto, HttpServletRequest request) {
        String clave = "staff:" + dto.getUsername().toLowerCase() + "@" + request.getRemoteAddr();
        if (rateLimiter.bloqueado(clave, LoginRateLimiter.MAX_FALLOS_STAFF, LoginRateLimiter.VENTANA_STAFF)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of("error",
                    "Demasiados intentos fallidos. Esperá 15 minutos y probá de nuevo."));
        }
        try {
            LoginResponseDTO resp = authService.login(dto);
            rateLimiter.limpiar(clave);
            return ResponseEntity.ok(resp);
        } catch (DisabledException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Tu cuenta está deshabilitada"));
        } catch (AuthenticationException e) {
            rateLimiter.registrar(clave, LoginRateLimiter.VENTANA_STAFF);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Usuario o contraseña incorrectos"));
        }
    }

    // ── Login socio: DNI + PIN ───────────────────────────────────────────────
    // Entrar NO registra ingreso: el pase se consume al escanear el QR de recepción.
    @PostMapping("/login-socio")
    public ResponseEntity<?> loginSocio(@RequestBody Map<String, String> body, HttpServletRequest request) {
        String claveIp = "dni@" + request.getRemoteAddr();
        if (rateLimiter.bloqueado(claveIp, LoginRateLimiter.MAX_INTENTOS_DNI, LoginRateLimiter.VENTANA_DNI)) {
            return demasiados("Demasiados intentos. Esperá un minuto y probá de nuevo.");
        }
        rateLimiter.registrar(claveIp, LoginRateLimiter.VENTANA_DNI);

        String dni = body.get("dni") == null ? "" : body.get("dni").trim();
        String pin = body.get("pin") == null ? "" : body.get("pin").trim();
        if (!dni.matches("[0-9]{6,10}") || !pin.matches("[0-9]{4}")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Ingresá tu DNI y tu PIN de 4 números"));
        }

        // Por DNI (sin importar la IP): frena que prueben los 10.000 PINs posibles
        String claveDni = "pin:" + dni;
        if (rateLimiter.bloqueado(claveDni, LoginRateLimiter.MAX_FALLOS_PIN, LoginRateLimiter.VENTANA_PIN)
                || rateLimiter.bloqueado(claveDni + ":dia", LoginRateLimiter.MAX_FALLOS_PIN_DIA, LoginRateLimiter.VENTANA_PIN_DIA)) {
            return demasiados("Demasiados intentos con este DNI. Probá más tarde o pedí un PIN nuevo en recepción.");
        }
        try {
            LoginResponseDTO resp = authService.loginSocio(dni, pin);
            rateLimiter.limpiar(claveDni);
            return ResponseEntity.ok(resp);
        } catch (AuthenticationException e) {
            rateLimiter.registrar(claveDni, LoginRateLimiter.VENTANA_PIN);
            rateLimiter.registrar(claveDni + ":dia", LoginRateLimiter.VENTANA_PIN_DIA);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error",
                    "DNI o PIN incorrectos. Si no tenés PIN o te lo olvidaste, pedilo en recepción."));
        }
    }

    // ── El socio cambia su PIN (devuelve un token nuevo: los anteriores dejan de valer) ──
    @PostMapping("/cambiar-pin")
    @PreAuthorize("hasRole('SOCIO')")
    public ResponseEntity<?> cambiarPin(@RequestBody Map<String, String> body,
                                        org.springframework.security.core.Authentication auth) {
        var usuario = pinService.cambiarPin(auth.getName(), body.get("pinActual"), body.get("pinNuevo"));
        return ResponseEntity.ok(authService.tokenSocio(usuario));
    }

    // ── Generar PIN para todos los socios activos que no tienen (solo ADMIN) ──
    // Devuelve la lista con los PIN en claro para imprimir y entregar. Solo se ven esta vez.
    @PostMapping("/pines-pendientes")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> pinesPendientes() {
        return ResponseEntity.ok(pinService.generarPendientes());
    }

    private static ResponseEntity<Map<String, String>> demasiados(String msg) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of("error", msg));
    }

    // ── Registro (solo ADMIN) ────────────────────────────────────────────────
    @PostMapping("/register")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> register(@Valid @RequestBody RegisterRequestDTO dto) {
        authService.register(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("mensaje", "Usuario '" + dto.getUsername() + "' creado correctamente"));
    }
}
