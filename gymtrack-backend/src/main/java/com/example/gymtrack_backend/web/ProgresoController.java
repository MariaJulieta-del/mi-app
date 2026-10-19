package com.example.gymtrack_backend.web;

import com.example.gymtrack_backend.entities.ProgresoEjercicio;
import com.example.gymtrack_backend.entities.RutinaEjercicio;
import com.example.gymtrack_backend.entities.Socio;
import com.example.gymtrack_backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/progreso")
@RequiredArgsConstructor
public class ProgresoController {

    private final ProgresoEjercicioRepository progresoRepo;
    private final RutinaEjercicioRepository   rutinaEjercicioRepo;
    private final com.example.gymtrack_backend.service.RutinasDelSocio rutinasDelSocio;
    private final SocioRepository             socioRepo;
    private final com.example.gymtrack_backend.security.AccesoSocio acceso;

    /** Guardar/actualizar progreso de hoy para un ejercicio */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','PROFESOR','SOCIO')")
    public ResponseEntity<?> guardarProgreso(@RequestBody Map<String, Object> body) {
        // Un socio solo puede registrar su propio progreso
        Long socioId = acceso.socioEfectivo(
                body.get("socioId") != null ? Long.valueOf(body.get("socioId").toString()) : null);
        if (socioId == null) return ResponseEntity.badRequest().body(Map.of("error", "Falta el socio"));
        Long reId    = Long.valueOf(body.get("rutinaEjercicioId").toString());

        Socio socio = socioRepo.findById(socioId)
                .orElseThrow(() -> new RuntimeException("Socio no encontrado"));
        RutinaEjercicio re = rutinaEjercicioRepo.findById(reId)
                .orElseThrow(() -> new RuntimeException("Ejercicio no encontrado"));
        // El ejercicio tiene que ser de una rutina de ese socio
        if (!rutinasDelSocio.puedeUsar(socioId, re.getRutina())) {
            return ResponseEntity.status(403).body(Map.of("error", "Ese ejercicio no pertenece a una rutina del socio"));
        }

        LocalDate fecha = LocalDate.now();

        // Upsert: si ya registró hoy, actualizar
        ProgresoEjercicio prog = progresoRepo
                .findBySocioIdAndRutinaEjercicioIdAndFecha(socioId, reId, fecha)
                .orElseGet(() -> {
                    ProgresoEjercicio p = new ProgresoEjercicio();
                    p.setSocio(socio);
                    p.setRutinaEjercicio(re);
                    p.setFecha(fecha);
                    return p;
                });

        if (body.get("pesoKg") != null)
            prog.setPesoKg(new BigDecimal(body.get("pesoKg").toString()));
        if (body.get("repeticionesReales") != null)
            prog.setRepeticionesReales(Integer.valueOf(body.get("repeticionesReales").toString()));
        if (body.get("seriesRealizadas") != null)
            prog.setSeriesRealizadas(Integer.valueOf(body.get("seriesRealizadas").toString()));
        if (body.containsKey("observacion"))
            prog.setObservacion((String) body.get("observacion"));
        if (body.containsKey("rpe")) {
            Object r = body.get("rpe");
            Short rpe = r == null ? null : Short.valueOf(r.toString());
            if (rpe != null && (rpe < 1 || rpe > 10)) return ResponseEntity.badRequest().body(Map.of("error", "El esfuerzo va de 1 a 10"));
            prog.setRpe(rpe);
        }

        progresoRepo.save(prog);
        return ResponseEntity.ok(Map.of("mensaje", "Progreso guardado"));
    }

    /**
     * Todo el progreso de un socio para una rutina.
     * Devuelve: { rutinaEjercicioId: [ {fecha, pesoKg, reps, series, obs}, ... ] }
     */
    @GetMapping("/socio/{socioId}/rutina/{rutinaId}")
    @PreAuthorize("@acceso.puedeVerSocio(#socioId)")
    public ResponseEntity<Map<Long, List<Map<String, Object>>>> getProgreso(
            @PathVariable Long socioId,
            @PathVariable Long rutinaId) {

        var registros = progresoRepo
                .findBySocioIdAndRutinaEjercicio_RutinaIdOrderByFechaDesc(socioId, rutinaId);

        Map<Long, List<Map<String, Object>>> resultado = registros.stream()
                .collect(Collectors.groupingBy(
                        p -> p.getRutinaEjercicio().getId(),
                        Collectors.mapping(p -> {
                            Map<String, Object> m = new LinkedHashMap<>();
                            m.put("id", p.getId());
                            m.put("fecha", p.getFecha().toString());
                            m.put("pesoKg", p.getPesoKg());
                            m.put("repeticionesReales", p.getRepeticionesReales());
                            m.put("seriesRealizadas", p.getSeriesRealizadas());
                            m.put("observacion", p.getObservacion());
                            m.put("rpe", p.getRpe());
                            return m;
                        }, Collectors.toList())
                ));

        return ResponseEntity.ok(resultado);
    }

    /** Mejor marca de un ejercicio (se agrupa por nombre: sigue aunque cambie la rutina) */
    public record Record(String ejercicio, BigDecimal pesoMax, LocalDate fechaPeso,
                         BigDecimal e1rm, LocalDate fechaE1rm, Integer repsMax) {}

    /**
     * Récords personales del socio. 1RM estimado con la fórmula de Epley: peso × (1 + reps / 30).
     * hastaAyer = true deja afuera lo de hoy (para saber si en el entrenamiento de hoy batió alguno).
     */
    @GetMapping("/socio/{socioId}/records")
    @PreAuthorize("@acceso.puedeVerSocio(#socioId)")
    public List<Record> records(@PathVariable Long socioId, @RequestParam(defaultValue = "false") boolean hastaAyer) {
        LocalDate hoy = LocalDate.now();
        Map<String, List<ProgresoEjercicio>> porEjercicio = new LinkedHashMap<>();
        for (ProgresoEjercicio p : progresoRepo.findBySocioIdOrderByFechaAsc(socioId)) {
            if (hastaAyer && !p.getFecha().isBefore(hoy)) continue;
            if (p.getRutinaEjercicio() == null || p.getRutinaEjercicio().getNombreEjercicio() == null) continue;
            porEjercicio.computeIfAbsent(p.getRutinaEjercicio().getNombreEjercicio().trim(), k -> new ArrayList<>()).add(p);
        }
        List<Record> lista = new ArrayList<>();
        for (var e : porEjercicio.entrySet()) {
            BigDecimal pesoMax = null, e1rmMax = null;
            LocalDate fPeso = null, fE1rm = null;
            Integer repsMax = null;
            for (ProgresoEjercicio p : e.getValue()) {
                if (p.getRepeticionesReales() != null && (repsMax == null || p.getRepeticionesReales() > repsMax)) repsMax = p.getRepeticionesReales();
                if (p.getPesoKg() == null || p.getPesoKg().signum() <= 0) continue;
                if (pesoMax == null || p.getPesoKg().compareTo(pesoMax) > 0) { pesoMax = p.getPesoKg(); fPeso = p.getFecha(); }
                int reps = p.getRepeticionesReales() == null ? 1 : Math.max(1, p.getRepeticionesReales());
                BigDecimal e1rm = p.getPesoKg().multiply(BigDecimal.ONE.add(BigDecimal.valueOf(reps).divide(BigDecimal.valueOf(30), 4, java.math.RoundingMode.HALF_UP)))
                        .setScale(1, java.math.RoundingMode.HALF_UP);
                if (e1rmMax == null || e1rm.compareTo(e1rmMax) > 0) { e1rmMax = e1rm; fE1rm = p.getFecha(); }
            }
            lista.add(new Record(e.getKey(), pesoMax, fPeso, e1rmMax, fE1rm, repsMax));
        }
        // Los récords más recientes primero
        lista.sort(Comparator.comparing((Record r) -> r.fechaE1rm() == null ? LocalDate.MIN : r.fechaE1rm()).reversed());
        return lista;
    }
}
