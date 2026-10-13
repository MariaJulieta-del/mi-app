package com.example.gymtrack_backend.kiosco;

import com.example.gymtrack_backend.entities.Asistencia;
import com.example.gymtrack_backend.repository.AsistenciaRepository;
import com.example.gymtrack_backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

/**
 * Pantallas fijas de recepción.
 *  - El admin vincula una pantalla y recibe un link con su token (se muestra una sola vez).
 *  - La pantalla solo puede pedir el QR vigente y los últimos ingresos (ver SecurityConfig).
 */
@RestController
@RequestMapping("/api/v1/kiosco")
@RequiredArgsConstructor
public class KioscoController {

    /** Las pantallas quedan vinculadas un año (o hasta que el admin las desvincule) */
    private static final long DURACION_TOKEN_MS = 365L * 24 * 60 * 60 * 1000;

    private final DispositivoKioscoRepository repo;
    private final AsistenciaRepository asistenciaRepo;
    private final JwtUtil jwtUtil;

    public record Vinculacion(Long id, String nombre, String token) {}
    public record Dispositivo(Long id, String nombre, LocalDateTime creado, String creadoPor, LocalDateTime ultimoUso) {}
    public record Ingreso(String nombre, LocalTime hora, boolean permitido) {}

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> vincular(@RequestBody Map<String, String> body, Authentication auth) {
        String nombre = Optional.ofNullable(body.get("nombre")).map(String::trim).orElse("");
        if (nombre.isEmpty() || nombre.length() > 60) {
            return ResponseEntity.badRequest().body(Map.of("error", "Poné un nombre para la pantalla (ej. Tablet recepción)"));
        }
        DispositivoKiosco d = new DispositivoKiosco();
        d.setNombre(nombre);
        d.setCreado(LocalDateTime.now());
        d.setCreadoPor(auth.getName());
        d = repo.save(d);
        String token = jwtUtil.generateKioscoToken(d.getId(), DURACION_TOKEN_MS);
        return ResponseEntity.ok(new Vinculacion(d.getId(), d.getNombre(), token));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<Dispositivo> listar() {
        return repo.findByActivoTrueOrderByCreadoDesc().stream()
                .map(d -> new Dispositivo(d.getId(), d.getNombre(), d.getCreado(), d.getCreadoPor(), d.getUltimoUso()))
                .toList();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> desvincular(@PathVariable Long id) {
        repo.findById(id).ifPresent(d -> { d.setActivo(false); repo.save(d); });
        return ResponseEntity.noContent().build();
    }

    /**
     * Últimos ingresos del día para mostrar en la pantalla: un renglón por socio,
     * con nombre y la inicial del apellido (sin DNI ni observaciones).
     */
    @GetMapping("/ultimos")
    @PreAuthorize("hasAnyRole('KIOSCO', 'ADMIN', 'PROFESOR')")
    public List<Ingreso> ultimos() {
        Map<Long, Ingreso> porSocio = new LinkedHashMap<>();
        for (Asistencia a : asistenciaRepo.findByFechaOrderByHoraDesc(LocalDate.now())) {
            if (!"ENTRADA".equals(a.getTipo()) || a.getSocio() == null) continue;
            String ape = a.getSocio().getApellido();
            String nombre = a.getSocio().getNombre() + (ape != null && !ape.isBlank() ? " " + ape.charAt(0) + "." : "");
            porSocio.putIfAbsent(a.getSocio().getId(), new Ingreso(nombre, a.getHora(), Boolean.TRUE.equals(a.getPermitido())));
            if (porSocio.size() == 6) break;
        }
        return new ArrayList<>(porSocio.values());
    }
}
