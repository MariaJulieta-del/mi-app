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
    /** Cambio con el que arrancó la caja */
    private BigDecimal fondoInicial;
    private BigDecimal totalEfectivo;
    private BigDecimal totalTarjeta;
    private BigDecimal totalTransferencia;
    /** totalEfectivo + totalTarjeta + totalTransferencia */
    private BigDecimal totalIngresos;
    private BigDecimal totalEgresos;
    /** fondoInicial + totalEfectivo - totalEgresos (plata física que debería haber) */
    private BigDecimal balanceCalculado;
    private BigDecimal montoContado;
    /** montoContado - balanceCalculado (positivo = sobrante, negativo = faltante) */
    private BigDecimal diferencia;
    /** Lo que quedó en la caja para el día siguiente */
    private BigDecimal dejaEnCaja;
    /** Lo que se retiró al cerrar (contado − lo que quedó) */
    private BigDecimal retiro;
    private int cantidadPagos;
    private String observaciones;
    private String creadoPor;
    private LocalDateTime createdAt;
    /** true si ya fue cerrada y guardada */
    private boolean cerrada;
}
