package com.example.gymtrack_backend.dto;

import com.example.gymtrack_backend.entities.enums.EstadoMembresia;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Membresía de un socio + estado de sus pases del mes en curso.
 * Todos los números de pases salen de MembresiaService.calcularPases() (única fuente de verdad).
 */
@Data
public class MembresiaResponseDTO {

    private Long id;
    private Long socioId;
    private String socioNombreCompleto;
    private String tipoMembresia;   // tarifas_membresia.tipo
    private String planNombre;      // nombre legible del plan
    private EstadoMembresia estadoMembresia;
    private LocalDate fechaInicio;
    private LocalDate fechaVencimiento;
    private BigDecimal precio;
    private LocalDateTime fechaCreacion;
    /** Días hasta el vencimiento (negativo si ya venció) */
    private Long diasRestantes;

    // ── Pases del ciclo mensual actual ───────────────────────────
    /** true = pase libre (sin límite de ingresos) */
    private boolean paseLibre;
    /** Pases por mes del plan (null si es libre) */
    private Integer pasesMensuales;
    private Integer pasesUsados;
    /** null si es libre */
    private Integer pasesRestantes;
    /** Ciclo mensual vigente: se reinicia cada mes contado desde fechaInicio */
    private LocalDate cicloInicio;
    private LocalDate cicloFin;
}
