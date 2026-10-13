package com.example.gymtrack_backend.web;

import com.example.gymtrack_backend.dto.NotificacionRequestDTO;
import com.example.gymtrack_backend.dto.NotificacionResponseDTO;
import com.example.gymtrack_backend.entities.Notificacion;
import com.example.gymtrack_backend.service.NotificacionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notificaciones")
@RequiredArgsConstructor
public class NotificacionController {

    private final NotificacionService service;
    private final com.example.gymtrack_backend.security.AccesoSocio acceso;

    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    @GetMapping
    public ResponseEntity<List<NotificacionResponseDTO>> listar() {
        return ResponseEntity.ok(service.listar());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    public ResponseEntity<NotificacionResponseDTO> crear(@Valid @RequestBody NotificacionRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.crear(dto));
    }

    /** Avisos para el socio que está usando la app */
    /** Qué canales están listos (mail configurado, cuántos socios tienen mail o teléfono) */
    @GetMapping("/canales")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    public NotificacionService.Canales canales() {
        return service.canales();
    }

    /** Links de WhatsApp con el aviso listo para cada socio */
    @GetMapping("/{id}/whatsapp")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    public NotificacionService.Whatsapp whatsapp(@PathVariable Long id) {
        return service.whatsapp(id);
    }

    @GetMapping("/mias")
    @PreAuthorize("hasRole('SOCIO')")
    public ResponseEntity<List<NotificacionResponseDTO>> mias() {
        return ResponseEntity.ok(service.listarParaSocio(acceso.socioIdActual()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    public ResponseEntity<Void> archivar(@PathVariable Long id) {
        service.archivar(id);
        return ResponseEntity.noContent().build();
    }
}
