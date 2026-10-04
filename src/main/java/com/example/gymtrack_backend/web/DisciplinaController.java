package com.example.gymtrack_backend.web;

import com.example.gymtrack_backend.dto.DisciplinaRequestDTO;
import com.example.gymtrack_backend.dto.DisciplinaResponseDTO;
import com.example.gymtrack_backend.entities.Disciplina;
import com.example.gymtrack_backend.service.DisciplinaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/disciplinas")
@RequiredArgsConstructor
public class DisciplinaController {

    private final DisciplinaService service;

    @GetMapping
    public ResponseEntity<List<DisciplinaResponseDTO>> listar(
            @RequestParam(defaultValue = "true") boolean soloActivas) {
        return ResponseEntity.ok(soloActivas ? service.listarActivas() : service.listarTodas());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Disciplina> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(service.obtener(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    public ResponseEntity<Disciplina> crear(@Valid @RequestBody DisciplinaRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.crear(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    public ResponseEntity<Disciplina> actualizar(@PathVariable Long id,
                                                  @Valid @RequestBody DisciplinaRequestDTO dto) {
        return ResponseEntity.ok(service.actualizar(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    public ResponseEntity<Void> desactivar(@PathVariable Long id) {
        service.desactivar(id);
        return ResponseEntity.noContent().build();
    }

    /** Renueva el mes: libera todos los cupos (desvincula socios inscriptos) */
    @PostMapping("/{id}/renovar-mes")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    public ResponseEntity<Void> renovarMes(@PathVariable Long id) {
        service.renovarMes(id);
        return ResponseEntity.ok().build();
    }
}
