package com.example.gymtrack_backend.web;

import com.example.gymtrack_backend.entities.Ejercicio;
import com.example.gymtrack_backend.repository.EjercicioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ejercicios")
@RequiredArgsConstructor
public class EjercicioController {

    private final EjercicioRepository ejercicioRepo;
    private final com.example.gymtrack_backend.service.EjercicioLimpiezaService limpieza;

    /** Listar todos los ejercicios activos (opcionalmente filtrar por grupo muscular) */
    @GetMapping
    public List<Ejercicio> listar(
            @RequestParam(required = false) String grupo) {
        if (grupo != null && !grupo.isBlank()) {
            return ejercicioRepo.findByActivoTrueAndGruposContaining(grupo);
        }
        return ejercicioRepo.findByActivoTrue();
    }

    /** Listar TODOS incluyendo inactivos (para el panel admin) */
    @GetMapping("/todos")
    public List<Ejercicio> listarTodos() {
        return ejercicioRepo.findAll();
    }

    /** Obtener por ID */
    @GetMapping("/{id}")
    public ResponseEntity<Ejercicio> obtener(@PathVariable Long id) {
        return ejercicioRepo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Crear nuevo ejercicio — solo ADMIN o EMPLEADO */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    public ResponseEntity<Ejercicio> crear(@RequestBody Ejercicio ejercicio) {
        ejercicio.setId(null);
        if (ejercicio.getActivo() == null) ejercicio.setActivo(true);
        if (ejercicio.getEsMaquina() == null) ejercicio.setEsMaquina(false);
        if (ejercicio.getMaquinaIds() == null) ejercicio.setMaquinaIds(new java.util.ArrayList<>());
        return ResponseEntity.ok(ejercicioRepo.save(ejercicio));
    }

    /** Actualizar ejercicio — solo ADMIN o EMPLEADO */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    public ResponseEntity<Ejercicio> actualizar(@PathVariable Long id,
                                                @RequestBody Ejercicio datos) {
        return ejercicioRepo.findById(id).map(e -> {
            e.setNombre(datos.getNombre());
            e.setDescripcion(datos.getDescripcion());
            if (datos.getGrupos() != null) {
                e.getGrupos().clear();
                e.getGrupos().addAll(datos.getGrupos());
            }
            e.setEsMaquina(datos.getEsMaquina() != null ? datos.getEsMaquina() : false);
            if (datos.getActivo() != null) e.setActivo(datos.getActivo());
            e.setImagenUrl(datos.getImagenUrl());
            if (datos.getMaquinaIds() != null) {
                e.getMaquinaIds().clear();
                e.getMaquinaIds().addAll(datos.getMaquinaIds());
            }
            return ResponseEntity.ok(ejercicioRepo.save(e));
        }).orElse(ResponseEntity.notFound().build());
    }

    /** Dar de baja lógica — solo ADMIN o EMPLEADO */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    public ResponseEntity<Void> desactivar(@PathVariable Long id) {
        return ejercicioRepo.findById(id).map(e -> {
            e.setActivo(false);
            ejercicioRepo.save(e);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    /** Reactivar ejercicio — solo ADMIN o EMPLEADO */
    @PatchMapping("/{id}/activar")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    public ResponseEntity<Ejercicio> activar(@PathVariable Long id) {
        return ejercicioRepo.findById(id).map(e -> {
            e.setActivo(true);
            return ResponseEntity.ok(ejercicioRepo.save(e));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Vista previa de la limpieza: ejercicios desactivados que ninguna rutina usa (se pueden borrar),
     * desactivados que sí están en rutinas (se conservan) y posibles duplicados por nombre.
     */
    @GetMapping("/limpieza")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<com.example.gymtrack_backend.service.EjercicioLimpiezaService.Vista> vistaLimpieza() {
        return ResponseEntity.ok(limpieza.vistaPrevia());
    }

    /** Borra definitivamente los ejercicios desactivados que ninguna rutina usa */
    @PostMapping("/limpieza")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Integer>> limpiar() {
        return ResponseEntity.ok(Map.of("borrados", limpieza.borrarViejos()));
    }

    /** Borra un ejercicio definitivamente (solo si ninguna rutina lo usa) */
    @DeleteMapping("/{id}/permanente")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> borrarPermanente(@PathVariable Long id) {
        limpieza.borrar(id);
        return ResponseEntity.noContent().build();
    }
}
