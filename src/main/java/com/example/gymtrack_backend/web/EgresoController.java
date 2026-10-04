package com.example.gymtrack_backend.web;

import com.example.gymtrack_backend.dto.EgresoRequestDTO;
import com.example.gymtrack_backend.dto.EgresoResponseDTO;
import com.example.gymtrack_backend.service.EgresoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/egresos")
@RequiredArgsConstructor
public class EgresoController {

    private final EgresoService egresoService;

    /** GET /api/v1/egresos/hoy — egresos del día actual */
    @GetMapping("/hoy")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<EgresoResponseDTO>> listarHoy() {
        return ResponseEntity.ok(egresoService.listarHoy());
    }

    /** GET /api/v1/egresos?desde=YYYY-MM-DD&hasta=YYYY-MM-DD */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<EgresoResponseDTO>> listar(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {

        if (desde != null && hasta != null) {
            return ResponseEntity.ok(egresoService.listarPorRango(desde, hasta));
        }
        return ResponseEntity.ok(egresoService.listarTodos());
    }

    /** GET /api/v1/egresos/total/hoy — suma de egresos del día */
    @GetMapping("/total/hoy")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> totalHoy() {
        BigDecimal total = egresoService.totalHoy();
        return ResponseEntity.ok(Map.of("total", total != null ? total : BigDecimal.ZERO));
    }

    /** GET /api/v1/egresos/total?desde=&hasta= */
    @GetMapping("/total")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> total(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        BigDecimal total = egresoService.totalPorRango(desde, hasta);
        return ResponseEntity.ok(Map.of("total", total != null ? total : BigDecimal.ZERO));
    }

    /** POST /api/v1/egresos */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EgresoResponseDTO> registrar(@Valid @RequestBody EgresoRequestDTO dto) {
        return ResponseEntity.ok(egresoService.registrar(dto));
    }

    /** DELETE /api/v1/egresos/{id} */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        egresoService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
