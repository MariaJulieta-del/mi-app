package com.example.gymtrack_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class EgresoRequestDTO {

    @NotNull
    private LocalDate fecha;

    @NotBlank
    private String descripcion;

    @NotNull
    @Positive
    private BigDecimal monto;

    private String categoria;   // LIMPIEZA | REPARACION | SUMINISTROS | VARIOS
    private String registradoPor;
}
