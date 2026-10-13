package com.example.gymtrack_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class EgresoResponseDTO {
    private Long          id;
    private LocalDate     fecha;
    private String        descripcion;
    private BigDecimal    monto;
    private String        categoria;
    private String        registradoPor;
    private LocalDateTime createdAt;
}
