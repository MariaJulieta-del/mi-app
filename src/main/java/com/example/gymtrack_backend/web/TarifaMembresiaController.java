package com.example.gymtrack_backend.web;

import com.example.gymtrack_backend.dto.TarifaMembresiaResponseDTO;
import com.example.gymtrack_backend.entities.TarifaMembresia;
import com.example.gymtrack_backend.service.TarifaMembresiaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * REST Controller para el tarifario / planes de membresía.
 * GET  /api/v1/tarifas          → lista todos los planes con socios activos
 * POST /api/v1/tarifas          → crear nuevo plan
 * PUT  /api/v1/tarifas/{tipo}   → actualizar precio y/o pases mensuales de un plan
 */
@RestController
@RequestMapping("/api/v1/tarifas")
public class TarifaMembresiaController {

    @Autowired
    private TarifaMembresiaService tarifaService;

    @GetMapping
    public ResponseEntity<List<TarifaMembresiaResponseDTO>> listar() {
        return ResponseEntity.ok(tarifaService.listarTodas());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TarifaMembresiaResponseDTO> crear(@RequestBody Map<String, Object> body) {
        TarifaMembresia plan = new TarifaMembresia();
        plan.setTipo(body.get("tipo").toString());
        plan.setNombre(body.getOrDefault("nombre", body.get("tipo")).toString());
        plan.setPrecio(new BigDecimal(body.get("precio").toString()));
        plan.setDuracionDias(Integer.parseInt(body.get("duracionDias").toString()));
        plan.setPasesMensuales(parsePases(body.get("pasesMensuales")));
        if (body.containsKey("incluye")) plan.setIncluye(body.get("incluye").toString());
        if (body.containsKey("descripcion")) plan.setDescripcion(body.get("descripcion").toString());
        return ResponseEntity.ok(tarifaService.crearPlan(plan));
    }

    @PutMapping("/{tipo}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TarifaMembresiaResponseDTO> actualizarPrecio(
            @PathVariable String tipo,
            @RequestBody Map<String, Object> body) {
        try {
            BigDecimal precio = body.get("precio") != null ? new BigDecimal(body.get("precio").toString()) : null;
            boolean cambiaPases = body.containsKey("pasesMensuales");
            Object nombre = body.get("nombre"), incluye = body.get("incluye");
            return ResponseEntity.ok(tarifaService.actualizar(tipo.toUpperCase(), precio,
                    cambiaPases, parsePases(body.get("pasesMensuales")),
                    nombre != null ? nombre.toString() : null, incluye != null ? incluye.toString() : null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /** PATCH /api/v1/tarifas/{tipo}/activo  { "activo": false } — deshabilitar / habilitar */
    @PatchMapping("/{tipo}/activo")
    @PreAuthorize("hasRole('ADMIN')")
    public TarifaMembresiaResponseDTO cambiarActivo(@PathVariable String tipo, @RequestBody Map<String, Boolean> body) {
        return tarifaService.cambiarActivo(tipo, Boolean.TRUE.equals(body.get("activo")));
    }

    /** DELETE /api/v1/tarifas/{tipo} — solo si ningún socio lo usó */
    @DeleteMapping("/{tipo}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable String tipo) {
        tarifaService.eliminar(tipo);
        return ResponseEntity.noContent().build();
    }

    /** null, vacío o 0 = pase libre */
    private Integer parsePases(Object valor) {
        if (valor == null || valor.toString().isBlank()) return null;
        int pases = Integer.parseInt(valor.toString());
        return pases > 0 ? pases : null;
    }
}
