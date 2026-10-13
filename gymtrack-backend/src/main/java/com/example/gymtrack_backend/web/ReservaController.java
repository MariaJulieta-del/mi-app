package com.example.gymtrack_backend.web;

import com.example.gymtrack_backend.dto.DisciplinaResponseDTO;
import com.example.gymtrack_backend.security.AccesoSocio;
import com.example.gymtrack_backend.service.DisciplinaService;
import com.example.gymtrack_backend.service.ReservaService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Clases para el socio: ver la agenda, reservar un lugar puntual, avisar que no va
 * y anotarse (o salir) como alumno fijo de una disciplina.
 * El staff puede operar por un socio pasando socioId.
 */
@RestController
@RequestMapping("/api/v1/reservas")
@RequiredArgsConstructor
public class ReservaController {

    private final ReservaService reservas;
    private final DisciplinaService disciplinas;
    private final AccesoSocio acceso;

    /** Clases de los próximos 7 días con lugares y el estado del socio en cada una */
    @GetMapping("/agenda")
    @PreAuthorize("hasAnyRole('ADMIN','PROFESOR','SOCIO')")
    public List<ReservaService.ClaseAgenda> agenda(@RequestParam(required = false) Long socioId) {
        return reservas.agenda(acceso.socioEfectivo(socioId));
    }

    /** Próximas clases del socio (fijas, reservadas o en espera) */
    @GetMapping("/mias")
    @PreAuthorize("hasAnyRole('ADMIN','PROFESOR','SOCIO')")
    public List<ReservaService.ClaseAgenda> mias(@RequestParam(required = false) Long socioId) {
        Long sid = acceso.socioEfectivo(socioId);
        if (sid == null) throw new IllegalArgumentException("Falta el socio");
        return reservas.misClases(sid);
    }

    /** Reservar: { disciplinaId, fecha, hora } */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','PROFESOR','SOCIO')")
    public ReservaService.Resultado reservar(@RequestBody Map<String, String> body) {
        return reservas.reservar(socio(body), Long.valueOf(body.get("disciplinaId")), LocalDate.parse(body.get("fecha")), body.get("hora"));
    }

    /** Cancelar una reserva o avisar que no va (alumno fijo): { disciplinaId, fecha, hora } */
    @PostMapping("/cancelar")
    @PreAuthorize("hasAnyRole('ADMIN','PROFESOR','SOCIO')")
    public ReservaService.Resultado cancelar(@RequestBody Map<String, String> body) {
        return reservas.cancelar(socio(body), Long.valueOf(body.get("disciplinaId")), LocalDate.parse(body.get("fecha")), body.get("hora"));
    }

    /** Anotarse como alumno fijo (todas las semanas) */
    @PostMapping("/disciplinas/{disciplinaId}/fijo")
    @PreAuthorize("hasAnyRole('ADMIN','PROFESOR','SOCIO')")
    public DisciplinaResponseDTO anotarse(@PathVariable Long disciplinaId, @RequestParam(required = false) Long socioId) {
        Long sid = acceso.socioEfectivo(socioId);
        if (sid == null) throw new IllegalArgumentException("Falta el socio");
        return disciplinas.inscribir(disciplinaId, sid);
    }

    /** Dejar de ser alumno fijo */
    @DeleteMapping("/disciplinas/{disciplinaId}/fijo")
    @PreAuthorize("hasAnyRole('ADMIN','PROFESOR','SOCIO')")
    public DisciplinaResponseDTO salir(@PathVariable Long disciplinaId, @RequestParam(required = false) Long socioId) {
        Long sid = acceso.socioEfectivo(socioId);
        if (sid == null) throw new IllegalArgumentException("Falta el socio");
        return disciplinas.desinscribir(disciplinaId, sid);
    }

    /** Para el staff: quién viene a una clase puntual, lista de espera y quién avisó que no */
    @GetMapping("/clase")
    @PreAuthorize("hasAnyRole('ADMIN','PROFESOR')")
    public ReservaService.DetalleClase clase(@RequestParam Long disciplinaId, @RequestParam LocalDate fecha, @RequestParam String hora) {
        return reservas.detalle(disciplinaId, fecha, hora);
    }

    private Long socio(Map<String, String> body) {
        Long sid = acceso.socioEfectivo(body.get("socioId") != null ? Long.valueOf(body.get("socioId")) : null);
        if (sid == null) throw new IllegalArgumentException("Falta el socio");
        if (body.get("disciplinaId") == null || body.get("fecha") == null || body.get("hora") == null) {
            throw new IllegalArgumentException("Faltan datos de la clase");
        }
        return sid;
    }
}
