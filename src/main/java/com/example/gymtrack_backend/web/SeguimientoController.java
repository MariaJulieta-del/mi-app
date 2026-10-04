package com.example.gymtrack_backend.web;

import com.example.gymtrack_backend.service.SeguimientoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/seguimiento")
@RequiredArgsConstructor
public class SeguimientoController {

    private final SeguimientoService service;

    /** Pantalla de inicio del profesor: quién entrena hoy y a quién atender */
    @GetMapping("/hoy")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    public ResponseEntity<SeguimientoService.Hoy> hoy() {
        return ResponseEntity.ok(service.hoy());
    }

    /** Progreso del socio: cargas por ejercicio y asistencia semanal (staff o el propio socio) */
    @GetMapping("/socio/{socioId}/progreso")
    @PreAuthorize("@acceso.puedeVerSocio(#socioId)")
    public ResponseEntity<SeguimientoService.Progreso> progreso(@PathVariable Long socioId) {
        return ResponseEntity.ok(service.progresoSocio(socioId));
    }
}
