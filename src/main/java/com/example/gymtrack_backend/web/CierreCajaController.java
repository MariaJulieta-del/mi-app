package com.example.gymtrack_backend.web;

import com.example.gymtrack_backend.dto.CierreCajaRequestDTO;
import com.example.gymtrack_backend.dto.CierreCajaResponseDTO;
import com.example.gymtrack_backend.service.CierreCajaService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/cierre-caja")
@RequiredArgsConstructor
public class CierreCajaController {

    private final CierreCajaService service;

    /** GET /api/v1/cierre-caja/resumen?fecha=YYYY-MM-DD (default hoy) */
    @GetMapping("/resumen")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CierreCajaResponseDTO> resumen(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        LocalDate dia = fecha != null ? fecha : LocalDate.now();
        return ResponseEntity.ok(service.resumenDia(dia));
    }

    /** POST /api/v1/cierre-caja — cerrar la caja del día (solo ADMIN) */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> cerrar(@RequestBody CierreCajaRequestDTO dto) {
        try {
            return ResponseEntity.ok(service.cerrar(dto));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** GET /api/v1/cierre-caja — historial de cierres */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<CierreCajaResponseDTO> historial() {
        return service.historial();
    }
}
