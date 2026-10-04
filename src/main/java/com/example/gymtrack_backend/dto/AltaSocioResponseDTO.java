package com.example.gymtrack_backend.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Respuesta del alta completa de un socio.
 * Incluye los datos del socio recién creado, su membresía y (si pagó) el pago.
 */
@Data
public class AltaSocioResponseDTO {

    // ── Socio ─────────────────────────────────────────
    private Long socioId;
    private String nombre;
    private String apellido;
    private String dni;
    /** PIN para entrar a la app (solo en esta respuesta; en la base queda el hash) */
    private String pin;

    // ── Membresía ─────────────────────────────────────
    private Long membresiaId;
    private String tipoMembresia;
    private String estadoMembresia;   // "ACTIVA"
    private LocalDate fechaInicio;
    private LocalDate fechaVencimiento;
    private BigDecimal precio;
    private Integer pasesMensuales;   // null = pase libre

    // ── Pago ──────────────────────────────────────────
    private Long pagoId;
    private String metodoPago;        // EFECTIVO | TARJETA | TRANSFERENCIA | null
    private BigDecimal montoPagado;
}
