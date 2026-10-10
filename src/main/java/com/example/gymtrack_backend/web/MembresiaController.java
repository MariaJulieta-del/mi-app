package com.example.gymtrack_backend.web;

import com.example.gymtrack_backend.dto.MembresiaResponseDTO;
import com.example.gymtrack_backend.entities.enums.EstadoMembresia;
import com.example.gymtrack_backend.service.MembresiaService;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

/**
 * REST Controller para el módulo de Membresías.
 * Cada socio tiene una sola membresía; se crea/renueva desde PagoController
 * (POST /pagos/con-membresia), que registra el pago en la misma operación.
 */
@RestController
@RequestMapping("/api/v1/membresias")
public class MembresiaController {

    @Autowired
    private MembresiaService membresiaService;

    // GET /api/v1/membresias → listar todas
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    @GetMapping
    public ResponseEntity<List<MembresiaResponseDTO>> listar() {
        return ResponseEntity.ok(membresiaService.listarTodas());
    }

    // GET /api/v1/membresias/{id} → detalle
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    @GetMapping("/{id}")
    public ResponseEntity<MembresiaResponseDTO> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(membresiaService.obtenerPorId(id));
    }

    // GET /api/v1/membresias/socio/{socioId} → la membresía del socio (204 si nunca pagó un plan)
    @PreAuthorize("@acceso.puedeVerSocio(#socioId)")
    @GetMapping("/socio/{socioId}")
    public ResponseEntity<MembresiaResponseDTO> obtenerDeSocio(@PathVariable Long socioId) {
        return membresiaService.obtenerDeSocio(socioId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    // GET /api/v1/membresias/socio/{socioId}/pases → pases que le quedan, cuándo los usó y meses anteriores
    @PreAuthorize("@acceso.puedeVerSocio(#socioId)")
    @GetMapping("/socio/{socioId}/pases")
    public MembresiaService.HistorialPases historialPases(@PathVariable Long socioId, @RequestParam(defaultValue = "90") int dias) {
        return membresiaService.historialPases(socioId, dias);
    }

    // GET /api/v1/membresias/proximas-a-vencer?dias=7 → membresías ACTIVAS que vencen pronto
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    @GetMapping("/proximas-a-vencer")
    public ResponseEntity<List<MembresiaResponseDTO>> proximasAVencer(
            @RequestParam(defaultValue = "7") int dias) {
        return ResponseEntity.ok(membresiaService.listarProximasAVencer(dias));
    }

    // PATCH /api/v1/membresias/{id}/estado → cancelar — solo ADMIN
    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> cambiarEstado(
            @PathVariable Long id,
            @RequestParam EstadoMembresia nuevoEstado) {
        try {
            return ResponseEntity.ok(membresiaService.cambiarEstado(id, nuevoEstado));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", com.example.gymtrack_backend.web.Errores.mensaje(e)));
        }
    }
}
