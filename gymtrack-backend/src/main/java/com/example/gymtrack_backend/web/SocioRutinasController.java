package com.example.gymtrack_backend.web;

import com.example.gymtrack_backend.dto.EjercicioResponseDTO;
import com.example.gymtrack_backend.dto.RutinaResponseDTO;
import com.example.gymtrack_backend.security.AccesoSocio;
import com.example.gymtrack_backend.service.RutinaService;
import com.example.gymtrack_backend.service.SolicitudRutinaService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * App del socio: ver las plantillas del gimnasio, elegir una y pedir una rutina personalizada.
 * El socio siempre es el autenticado (nunca se toma un ID que mande el cliente).
 */
@RestController
@RequestMapping("/api/v1/socio-app/rutinas")
@PreAuthorize("hasRole('SOCIO')")
@RequiredArgsConstructor
public class SocioRutinasController {

    private final RutinaService rutinaService;
    private final SolicitudRutinaService solicitudes;
    private final AccesoSocio acceso;

    @GetMapping("/plantillas")
    public List<RutinaResponseDTO> plantillas() {
        return rutinaService.plantillasParaSocios();
    }

    @GetMapping("/plantillas/{id}/ejercicios")
    public List<EjercicioResponseDTO> ejercicios(@PathVariable Long id) {
        return rutinaService.ejerciciosDePlantilla(id);
    }

    /** Copiarse una plantilla como rutina propia */
    @PostMapping("/plantillas/{id}/elegir")
    public RutinaResponseDTO elegir(@PathVariable Long id) {
        return rutinaService.elegirPlantilla(acceso.socioIdActual(), id);
    }

    public record NuevoPedido(
            @Size(max = 20, message = "Objetivo inválido") String objetivo,
            @Min(value = 1, message = "Los días por semana van de 1 a 7") @Max(value = 7, message = "Los días por semana van de 1 a 7") Integer diasSemana,
            @Size(max = 500, message = "El mensaje no puede superar los 500 caracteres") String mensaje) {}

    @GetMapping("/pedido")
    public ResponseEntity<SolicitudRutinaService.Pedido> pedido() {
        SolicitudRutinaService.Pedido p = solicitudes.delSocio(acceso.socioIdActual());
        return p == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(p);
    }

    @PostMapping("/pedido")
    public SolicitudRutinaService.Pedido pedir(@Valid @RequestBody NuevoPedido body) {
        return solicitudes.pedir(acceso.socioIdActual(), body.objetivo(), body.diasSemana(), body.mensaje());
    }

    @DeleteMapping("/pedido")
    public ResponseEntity<Void> cancelar() {
        solicitudes.cancelar(acceso.socioIdActual());
        return ResponseEntity.noContent().build();
    }
}
