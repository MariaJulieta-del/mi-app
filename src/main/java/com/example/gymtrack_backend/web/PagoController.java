package com.example.gymtrack_backend.web;

import com.example.gymtrack_backend.dto.PagoConMembresiaRequestDTO;
import com.example.gymtrack_backend.dto.PagoResponseDTO;
import com.example.gymtrack_backend.service.PagoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * REST Controller para el módulo de Pagos.
 */
@RestController
@RequestMapping("/api/v1/pagos")
public class PagoController {

    @Autowired
    private PagoService pagoService;

    // GET /api/v1/pagos → listar todos
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<PagoResponseDTO>> listar() {
        return ResponseEntity.ok(pagoService.listarTodos());
    }

    // POST /api/v1/pagos/con-membresia → cobra un plan: crea o renueva la membresía del socio (admin y profesor)
    @PostMapping("/con-membresia")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    public ResponseEntity<?> registrarConMembresia(
            @Valid @RequestBody PagoConMembresiaRequestDTO dto) {
        try {
            return ResponseEntity.ok(pagoService.registrarConMembresia(dto));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(
                java.util.Map.of("error", e.getMessage() != null ? e.getMessage() : "Error al registrar el pago")
            );
        }
    }

    // GET /api/v1/pagos/membresia/{membresiaId} → historial por membresía
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/membresia/{membresiaId}")
    public ResponseEntity<List<PagoResponseDTO>> porMembresia(
            @PathVariable Long membresiaId) {
        try {
            return ResponseEntity.ok(pagoService.obtenerPorMembresia(membresiaId));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
