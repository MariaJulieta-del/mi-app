package com.example.gymtrack_backend.web;

import com.example.gymtrack_backend.entities.Rutina;
import com.example.gymtrack_backend.entities.SesionEntrenamiento;
import com.example.gymtrack_backend.entities.Socio;
import com.example.gymtrack_backend.repository.RutinaRepository;
import com.example.gymtrack_backend.repository.SesionEntrenamientoRepository;
import com.example.gymtrack_backend.repository.SocioRepository;
import com.example.gymtrack_backend.security.AccesoSocio;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Entrenamientos terminados desde "Entrenar". Al final el socio cuenta cómo se sintió;
 * el profe lo ve en "Hoy" para ajustar la rutina.
 */
@RestController
@RequestMapping("/api/v1/sesiones")
@RequiredArgsConstructor
public class SesionController {

    private final SesionEntrenamientoRepository sesionRepo;
    private final SocioRepository socioRepo;
    private final RutinaRepository rutinaRepo;
    private final AccesoSocio acceso;

    public record Sesion(Long id, Long socioId, String socioNombre, String telefono, Long rutinaId, String rutinaNombre,
                         Integer dia, LocalDate fecha, Integer duracionMin, Integer series, BigDecimal volumenKg,
                         Integer records, String sensacion, String comentario, boolean leida, LocalDateTime creada) {}

    static Sesion dto(SesionEntrenamiento s) {
        Socio so = s.getSocio();
        return new Sesion(s.getId(), so.getId(), so.getNombre() + " " + so.getApellido(), so.getTelefono(),
                s.getRutina() != null ? s.getRutina().getId() : null, s.getRutinaNombre(), s.getDia(), s.getFecha(),
                s.getDuracionMin(), s.getSeries(), s.getVolumenKg(), s.getRecords(), s.getSensacion(), s.getComentario(),
                Boolean.TRUE.equals(s.getLeida()), s.getCreada());
    }

    /** El socio termina su entrenamiento (el staff también puede registrarlo por él) */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','PROFESOR','SOCIO')")
    @Transactional
    public Sesion registrar(@RequestBody Map<String, Object> body) {
        Long socioId = acceso.socioEfectivo(body.get("socioId") != null ? Long.valueOf(body.get("socioId").toString()) : null);
        if (socioId == null) throw new IllegalArgumentException("Falta el socio");
        Socio socio = socioRepo.findById(socioId).orElseThrow(() -> new IllegalArgumentException("Socio no encontrado"));

        String sensacion = body.get("sensacion") == null ? null : body.get("sensacion").toString();
        if (sensacion != null && !SesionEntrenamiento.SENSACIONES.contains(sensacion)) {
            throw new IllegalArgumentException("Sensación inválida");
        }
        String comentario = body.get("comentario") == null ? null : body.get("comentario").toString().trim();
        if (comentario != null && comentario.length() > 500) comentario = comentario.substring(0, 500);

        SesionEntrenamiento s = new SesionEntrenamiento();
        s.setSocio(socio);
        if (body.get("rutinaId") != null) {
            Rutina r = rutinaRepo.findById(Long.valueOf(body.get("rutinaId").toString())).orElse(null);
            // Solo rutinas del propio socio
            if (r != null && r.getSocio() != null && r.getSocio().getId().equals(socioId)) {
                s.setRutina(r);
                s.setRutinaNombre(r.getNombre());
            }
        }
        s.setDia(entero(body.get("dia")));
        s.setFecha(LocalDate.now());
        s.setDuracionMin(entero(body.get("duracionMin")));
        s.setSeries(entero(body.get("series")));
        s.setVolumenKg(body.get("volumenKg") == null ? null : new BigDecimal(body.get("volumenKg").toString()));
        Integer records = entero(body.get("records"));
        s.setRecords(records == null ? 0 : Math.max(0, records));
        s.setSensacion(sensacion);
        s.setComentario(comentario == null || comentario.isEmpty() ? null : comentario);
        return dto(sesionRepo.save(s));
    }

    /** Historial de entrenamientos de un socio */
    @GetMapping("/socio/{socioId}")
    @PreAuthorize("@acceso.puedeVerSocio(#socioId)")
    @Transactional(readOnly = true)
    public List<Sesion> delSocio(@PathVariable Long socioId) {
        return sesionRepo.findBySocioIdOrderByFechaDescCreadaDesc(socioId).stream().limit(60).map(SesionController::dto).toList();
    }

    /** Lo que contaron los socios en los últimos días (para el profe) */
    @GetMapping("/recientes")
    @PreAuthorize("hasAnyRole('ADMIN','PROFESOR')")
    @Transactional(readOnly = true)
    public List<Sesion> recientes(@RequestParam(defaultValue = "7") int dias) {
        return sesionRepo.recientes(LocalDate.now().minusDays(Math.max(1, Math.min(dias, 60)))).stream()
                .map(SesionController::dto).toList();
    }

    @PatchMapping("/{id}/leida")
    @PreAuthorize("hasAnyRole('ADMIN','PROFESOR')")
    @Transactional
    public void marcarLeida(@PathVariable Long id) {
        sesionRepo.findById(id).ifPresent(s -> s.setLeida(true));
    }

    private static Integer entero(Object o) {
        if (o == null) return null;
        try { return (int) Math.round(Double.parseDouble(o.toString())); } catch (NumberFormatException e) { return null; }
    }
}
