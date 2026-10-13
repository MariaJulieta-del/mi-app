package com.example.gymtrack_backend.web;

import com.example.gymtrack_backend.security.AccesoSocio;
import com.example.gymtrack_backend.service.GamificacionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/gamificacion")
@RequiredArgsConstructor
public class GamificacionController {

    private final GamificacionService service;
    private final AccesoSocio acceso;

    /** Insignias, rachas y desafío del mes de un socio */
    @GetMapping("/socio/{socioId}")
    @PreAuthorize("@acceso.puedeVerSocio(#socioId)")
    public GamificacionService.Logros logros(@PathVariable Long socioId) {
        return service.logros(socioId);
    }

    /** Ranking del mes (solo socios que eligieron aparecer) */
    @GetMapping("/ranking")
    @PreAuthorize("hasAnyRole('ADMIN','PROFESOR','SOCIO')")
    public GamificacionService.Ranking ranking() {
        return service.ranking(acceso.socioEfectivo(null));
    }

    /** El socio elige si aparece en el ranking: { participa: true|false } */
    @PutMapping("/ranking")
    @PreAuthorize("hasRole('SOCIO')")
    public Map<String, Boolean> participar(@RequestBody Map<String, Boolean> body) {
        Long socioId = acceso.socioEfectivo(null);
        return Map.of("participa", service.participar(socioId, Boolean.TRUE.equals(body.get("participa"))));
    }
}
