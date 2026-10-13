package com.example.gymtrack_backend.web;

import com.example.gymtrack_backend.dto.AsistenciaCheckinDTO;
import com.example.gymtrack_backend.dto.AsistenciaResponseDTO;
import com.example.gymtrack_backend.service.AsistenciaService;
import com.example.gymtrack_backend.service.QrIngresoService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/asistencias")
@RequiredArgsConstructor
public class AsistenciaController {

    private final AsistenciaService service;
    private final QrIngresoService  qrIngresoService;

    /** Registrar ingreso/salida de un socio (validando membresía) */
    @PostMapping("/checkin")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    public ResponseEntity<AsistenciaResponseDTO> checkin(@RequestBody AsistenciaCheckinDTO dto) {
        return ResponseEntity.ok(service.registrarCheckin(dto));
    }

    /** Código QR vigente para mostrar en la pantalla de recepción (rota cada 30 s) */
    @GetMapping("/qr-actual")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR', 'KIOSCO')")
    public ResponseEntity<QrIngresoService.CodigoQr> qrActual() {
        return ResponseEntity.ok(qrIngresoService.codigoActual());
    }

    /** El socio registra su ingreso escaneando el QR de recepción. Recién acá se consume el pase. */
    @PostMapping("/qr")
    @PreAuthorize("hasRole('SOCIO')")
    public ResponseEntity<?> ingresoPorQr(@RequestBody Map<String, String> body, Authentication auth) {
        try {
            return ResponseEntity.ok(service.registrarPorQr(auth.getName(), body.get("codigo")));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Asistencias del día de hoy */
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    @GetMapping("/hoy")
    public ResponseEntity<List<AsistenciaResponseDTO>> hoy() {
        return ResponseEntity.ok(service.listarHoy());
    }

    /** Historial de asistencias de un socio */
    @PreAuthorize("@acceso.puedeVerSocio(#socioId)")
    @GetMapping("/socio/{socioId}")
    public ResponseEntity<List<AsistenciaResponseDTO>> porSocio(@PathVariable Long socioId) {
        return ResponseEntity.ok(service.listarPorSocio(socioId));
    }

    /** Rango de fechas */
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    @GetMapping
    public ResponseEntity<List<AsistenciaResponseDTO>> porRango(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ResponseEntity.ok(service.listarPorRango(desde, hasta));
    }
}
