package com.example.gymtrack_backend.auditoria;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/** Consulta del registro de auditoría (solo ADMIN) */
@RestController
@RequestMapping("/api/v1/auditoria")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AuditoriaController {

    private final AuditoriaRepository repo;

    /** Últimos movimientos en un rango de fechas (por defecto, los últimos 30 días) */
    @GetMapping
    public ResponseEntity<List<Auditoria>> listar(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(required = false) Long socioId) {
        if (socioId != null) {
            return ResponseEntity.ok(repo.findBySocioIdOrderByFechaDesc(socioId, PageRequest.of(0, 500)));
        }
        LocalDate h = hasta != null ? hasta : LocalDate.now();
        LocalDate d = desde != null ? desde : h.minusDays(30);
        return ResponseEntity.ok(repo.findByFechaBetweenOrderByFechaDesc(
                d.atStartOfDay(), h.plusDays(1).atStartOfDay(), PageRequest.of(0, 1000)));
    }
}
