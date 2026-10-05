package com.example.gymtrack_backend.web;

import com.example.gymtrack_backend.dto.AltaSocioRequestDTO;
import com.example.gymtrack_backend.dto.AltaSocioResponseDTO;
import com.example.gymtrack_backend.entities.Socio;
import com.example.gymtrack_backend.repository.SocioRepository;
import com.example.gymtrack_backend.service.SocioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/socios")
@CrossOrigin(origins = "*")
public class SocioController {

    @Autowired
    private SocioService socioService;

    @Autowired
    private SocioRepository socioRepository;

    @Autowired
    private com.example.gymtrack_backend.service.PinService pinService;

    // GET - Obtener socios activos
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    @GetMapping
    public List<Socio> obtenerTodos() {
        return socioService.obtenerTodos();
    }

    // GET - Obtener TODOS los socios (activos + inactivos)
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    @GetMapping("/todos")
    public List<Socio> obtenerTodosConInactivos() {
        return socioService.obtenerTodosConInactivos();
    }

    // GET- read - Obtener socio por ID
    @PreAuthorize("@acceso.puedeVerSocio(#id)")
    @GetMapping ("/{id}")
    public ResponseEntity<Socio> obtenerPorId(@PathVariable Long id) {
        return socioService.obtenerPorId(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    // POST - Alta completa: socio + membresía + pago (o pendiente)
    @PostMapping("/alta")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    public ResponseEntity<?> altaCompleta(@RequestBody AltaSocioRequestDTO dto) {
        try {
            AltaSocioResponseDTO resp = socioService.altaCompleta(dto);
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    // POST- create - Crear nuevo socio (legado — solo datos personales, sin membresía)
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    public ResponseEntity<Socio> crear(@RequestBody Socio socio) {
        try {
            return ResponseEntity.ok(socioService.crear(socio));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // PUT- update - Actualizar socio
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    public ResponseEntity<Socio> actualizar(@PathVariable Long id, 
                                             @RequestBody Socio socio) {
        try {
            return ResponseEntity.ok(socioService.actualizar(id, socio));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // DELETE - Baja lógica
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    public ResponseEntity<Void> darDeBaja(@PathVariable Long id) {
        try {
            socioService.darDeBaja(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // DELETE - Eliminación física (solo socios inactivos)
    @DeleteMapping("/{id}/permanente")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminarPermanente(@PathVariable Long id) {
        try {
            socioService.eliminarPermanente(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // PUT - Reactivar socio dado de baja
    @PutMapping("/{id}/reactivar")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    public ResponseEntity<Socio> reactivar(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(socioService.reactivar(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // POST - Genera un PIN nuevo para el socio (lo olvidó o nunca tuvo). Se muestra una sola vez.
    //        Cierra las sesiones que tenía abiertas con el PIN anterior.
    @PostMapping("/{id}/pin")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    public ResponseEntity<java.util.Map<String, String>> generarPin(@PathVariable Long id) {
        return ResponseEntity.ok(java.util.Map.of("pin", pinService.asignarNuevoPin(id)));
    }
}
