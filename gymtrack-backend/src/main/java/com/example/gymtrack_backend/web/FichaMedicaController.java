package com.example.gymtrack_backend.web;

import com.example.gymtrack_backend.dto.FichaMedicaRequestDTO;
import com.example.gymtrack_backend.entities.FichaMedica;
import com.example.gymtrack_backend.service.FichaMedicaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/fichas-medicas")
@RequiredArgsConstructor
public class FichaMedicaController {

    private final FichaMedicaService service;

    @PreAuthorize("@acceso.puedeVerSocio(#socioId)")
    @GetMapping("/socio/{socioId}")
    public ResponseEntity<FichaMedica> obtener(@PathVariable Long socioId) {
        return ResponseEntity.ok(service.obtenerPorSocio(socioId));
    }

    @PutMapping("/socio/{socioId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    public ResponseEntity<FichaMedica> guardar(@PathVariable Long socioId,
                                                @RequestBody FichaMedicaRequestDTO dto) {
        return ResponseEntity.ok(service.guardar(socioId, dto));
    }
}
