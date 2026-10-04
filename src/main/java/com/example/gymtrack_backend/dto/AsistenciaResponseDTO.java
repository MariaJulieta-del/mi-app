package com.example.gymtrack_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@AllArgsConstructor
public class AsistenciaResponseDTO {
    private Long      id;
    private Long      socioId;
    private String    socioNombre;
    private String    socioDni;
    private LocalDate fecha;
    private LocalTime hora;
    private String    tipo;
    private Boolean   permitido;
    private String    observacion;

    // ── Info de membresía (solo se llena en el check-in) ──
    private LocalDate fechaVencimiento;
    private String    tipoMembresia;
    /** true = pase libre (sin límite de ingresos) */
    private Boolean   paseLibre;
    /** Pases por mes del plan (null si es libre) */
    private Integer   pasesMensuales;
    /** Pases usados en el ciclo mensual actual (incluye el ingreso de hoy) */
    private Integer   pasesUsados;
    /** Pases que le quedan en el ciclo (null si es libre) */
    private Integer   pasesRestantes;
    /** Semáforo: VERDE (ok), AMARILLO (ok pero quedan pocos pases / vence pronto), ROJO (denegado) */
    private String    estadoAcceso;
}
