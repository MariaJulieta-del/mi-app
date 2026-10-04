package com.example.gymtrack_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CierreCajaResponseDTO {
    private Long id;
    private LocalDate fecha;
    private BigDecimal totalEfectivo;
    private BigDecimal totalTarjeta;
    private BigDecimal totalTransferencia;
    /** totalEfectivo + totalTarjeta + totalTransferencia */
    private BigDecimal totalIngresos;
    private BigDecimal totalEgresos;
    /** totalEfectivo - totalEgresos (plata física en caja) */
    private BigDecimal balanceCalculado;
    private BigDecimal montoContado;
    /** montoContado - balanceCalculado (positivo = sobrante, negativo = faltante) */
    private BigDecimal diferencia;
    private int cantidadPagos;
    private String observaciones;
    private String creadoPor;
    private LocalDateTime createdAt;
    /** true si ya fue cerrada y guardada */
    private boolean cerrada;
}
