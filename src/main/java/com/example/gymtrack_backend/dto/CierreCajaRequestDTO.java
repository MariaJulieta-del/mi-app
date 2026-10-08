package com.example.gymtrack_backend.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CierreCajaRequestDTO {
    /** Fecha del cierre (default: hoy) */
    private LocalDate fecha;
    /** Monto que contó físicamente el encargado en la caja (opcional) */
    private BigDecimal montoContado;
    /** Cuánto efectivo queda en la caja para arrancar el día siguiente */
    private BigDecimal dejaEnCaja;
    private String observaciones;
    private String creadoPor;
}
