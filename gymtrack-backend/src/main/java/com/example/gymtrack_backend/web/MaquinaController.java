package com.example.gymtrack_backend.web;

import com.example.gymtrack_backend.dto.MaquinaRequestDTO;
import com.example.gymtrack_backend.entities.Maquina;
import com.example.gymtrack_backend.service.MaquinaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/maquinas")
@RequiredArgsConstructor
public class MaquinaController {

    private final MaquinaService service;

    @GetMapping
    public ResponseEntity<List<Maquina>> listar(
            @RequestParam(defaultValue = "true") boolean soloActivas) {
        return ResponseEntity.ok(soloActivas ? service.listarActivas() : service.listarTodas());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Maquina> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(service.obtener(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    public ResponseEntity<?> crear(@Valid @RequestBody MaquinaRequestDTO dto) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(service.crear(dto));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", com.example.gymtrack_backend.web.Errores.mensaje(e)));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    public ResponseEntity<?> actualizar(@PathVariable Long id,
                                         @Valid @RequestBody MaquinaRequestDTO dto) {
        try {
            return ResponseEntity.ok(service.actualizar(id, dto));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", com.example.gymtrack_backend.web.Errores.mensaje(e)));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    public ResponseEntity<Void> desactivar(@PathVariable Long id) {
        service.desactivar(id);
        return ResponseEntity.noContent().build();
    }

    /** Borrar definitivamente (solo si no tiene arreglos registrados) */
    @DeleteMapping("/{id}/definitivo")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/activar")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    public ResponseEntity<Maquina> activar(@PathVariable Long id) {
        return ResponseEntity.ok(service.activar(id));
    }
}
