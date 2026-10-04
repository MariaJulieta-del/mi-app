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
        Socio duenio = re.getRutina() != null ? re.getRutina().getSocio() : null;
        if (duenio == null || !duenio.getId().equals(socioId)) {
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
                            return m;
                        }, Collectors.toList())
                ));

        return ResponseEntity.ok(resultado);
    }
}
