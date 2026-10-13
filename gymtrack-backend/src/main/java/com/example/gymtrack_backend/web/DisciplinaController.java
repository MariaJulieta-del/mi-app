package com.example.gymtrack_backend.web;

import com.example.gymtrack_backend.dto.DisciplinaRequestDTO;
import com.example.gymtrack_backend.dto.DisciplinaResponseDTO;
import com.example.gymtrack_backend.security.AccesoSocio;
import com.example.gymtrack_backend.service.DisciplinaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/disciplinas")
@RequiredArgsConstructor
public class DisciplinaController {

    private final DisciplinaService service;
    private final AccesoSocio acceso;
    private final com.example.gymtrack_backend.service.NotificacionService notificacionService;

    /**
     * Staff: todas (con inscriptos). Socio: solo las activas, sin la lista de inscriptos
     * y con la marca de si él está inscripto.
     */
    @GetMapping
    public ResponseEntity<List<DisciplinaResponseDTO>> listar(@RequestParam(defaultValue = "true") boolean soloActivas,
                                                              org.springframework.security.core.Authentication auth) {
        if (acceso.esStaff()) return ResponseEntity.ok(service.listar(soloActivas, true, null, auth.getName()));
        return ResponseEntity.ok(service.listar(true, false, acceso.socioIdActual(), null));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    public ResponseEntity<DisciplinaResponseDTO> detalle(@PathVariable Long id) {
        return ResponseEntity.ok(service.detalle(id));
    }

    /** Clases de hoy, ordenadas por hora */
    @GetMapping("/hoy")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    public ResponseEntity<List<DisciplinaService.ClaseHoy>> hoy() {
        return ResponseEntity.ok(service.clasesDeHoy());
    }

    /** Profesores para elegir como instructor */
    @GetMapping("/instructores")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    public ResponseEntity<List<DisciplinaService.Instructor>> instructores() {
        return ResponseEntity.ok(service.instructores());
    }

    /** Disciplinas de un socio (staff o el propio socio) */
    @GetMapping("/socio/{socioId}")
    @PreAuthorize("@acceso.puedeVerSocio(#socioId)")
    public ResponseEntity<List<DisciplinaResponseDTO>> delSocio(@PathVariable Long socioId) {
        return ResponseEntity.ok(service.delSocio(socioId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    public ResponseEntity<DisciplinaResponseDTO> crear(@Valid @RequestBody DisciplinaRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.crear(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    public ResponseEntity<DisciplinaResponseDTO> actualizar(@PathVariable Long id, @Valid @RequestBody DisciplinaRequestDTO dto) {
        return ResponseEntity.ok(service.actualizar(id, dto));
    }

    /** Activar o desactivar (desactivar no borra nada: deja de mostrarse y no admite inscripciones) */
    @PatchMapping("/{id}/activa")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    public ResponseEntity<Void> cambiarActiva(@PathVariable Long id, @RequestParam boolean valor) {
        service.cambiarActiva(id, valor);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/inscripciones")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    public ResponseEntity<DisciplinaResponseDTO> inscribir(@PathVariable Long id, @RequestBody Map<String, Long> body) {
        Long socioId = body.get("socioId");
        if (socioId == null) throw new IllegalArgumentException("Falta el socio");
        return ResponseEntity.ok(service.inscribir(id, socioId));
    }

    @DeleteMapping("/{id}/inscripciones/{socioId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    public ResponseEntity<DisciplinaResponseDTO> desinscribir(@PathVariable Long id, @PathVariable Long socioId) {
        return ResponseEntity.ok(service.desinscribir(id, socioId));
    }

    /** Quién vino a cada clase de las últimas semanas (según el ingreso al gimnasio) */
    @GetMapping("/{id}/asistencia")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    public ResponseEntity<DisciplinaService.AsistenciaClase> asistencia(@PathVariable Long id, @RequestParam(defaultValue = "4") int semanas) {
        return ResponseEntity.ok(service.asistencia(id, semanas));
    }

    /** Aviso a todos los alumnos de la disciplina (lo ven en la app y por email si está activado) */
    @PostMapping("/{id}/avisos")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    public ResponseEntity<com.example.gymtrack_backend.service.NotificacionService.AvisoEnviado> avisar(
            @PathVariable Long id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(notificacionService.avisarDisciplina(id, body.get("titulo"), body.get("mensaje")));
    }

    /** Saca a los inscriptos dados de baja o sin membresía vigente */
    @PostMapping("/{id}/liberar-cupos")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    public ResponseEntity<Map<String, Integer>> liberarCupos(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("liberados", service.liberarCupos(id)));
    }
}
