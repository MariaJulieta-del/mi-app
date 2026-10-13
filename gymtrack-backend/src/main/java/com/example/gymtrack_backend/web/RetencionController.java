package com.example.gymtrack_backend.web;

import com.example.gymtrack_backend.service.RetencionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Tareas de retención para el staff (escribirle a un socio para que no se vaya o para que vuelva) */
@RestController
@RequestMapping("/api/v1/retencion")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','PROFESOR')")
public class RetencionController {

    private final RetencionService service;

    @GetMapping("/tareas")
    public List<RetencionService.Tarea> tareas() {
        return service.pendientes();
    }

    /** { estado: HECHA | DESCARTADA } */
    @PatchMapping("/tareas/{id}")
    public void resolver(@PathVariable Long id, @RequestBody Map<String, String> body, Authentication auth) {
        service.resolver(id, body.get("estado"), auth.getName());
    }

    @GetMapping("/resumen")
    public RetencionService.Resumen resumen() {
        return service.resumen();
    }

    /** Correr ahora la revisión diaria (normalmente corre sola a las 9) */
    @PostMapping("/generar")
    @PreAuthorize("hasRole('ADMIN')")
    public RetencionService.Generadas generar() {
        return service.generar();
    }
}
