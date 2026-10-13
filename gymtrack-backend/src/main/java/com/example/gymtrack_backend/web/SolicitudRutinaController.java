package com.example.gymtrack_backend.web;

import com.example.gymtrack_backend.service.SolicitudRutinaService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Pedidos de rutina personalizada para el staff (tareas pendientes) */
@RestController
@RequestMapping("/api/v1/pedidos-rutina")
@PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
@RequiredArgsConstructor
public class SolicitudRutinaController {

    private final SolicitudRutinaService service;

    public record Bandeja(List<SolicitudRutinaService.Pedido> abiertos, List<SolicitudRutinaService.Pedido> resueltos) {}

    @GetMapping
    public Bandeja bandeja() {
        return new Bandeja(service.abiertos(), service.resueltosRecientes());
    }

    /** Para el contador del menú */
    @GetMapping("/cantidad")
    public Map<String, Long> cantidad() {
        return Map.of("abiertos", service.cantidadAbiertos());
    }

    @PatchMapping("/{id}/tomar")
    public SolicitudRutinaService.Pedido tomar(@PathVariable Long id) {
        return service.tomar(id);
    }

    @PatchMapping("/{id}/hecho")
    public SolicitudRutinaService.Pedido hecho(@PathVariable Long id) {
        return service.marcarHecho(id);
    }

    @PatchMapping("/{id}/descartar")
    public SolicitudRutinaService.Pedido descartar(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return service.descartar(id, body == null ? null : body.get("motivo"));
    }
}
