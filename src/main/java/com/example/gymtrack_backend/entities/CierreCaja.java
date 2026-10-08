package com.example.gymtrack_backend.entities;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "cierre_caja")
public class CierreCaja {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private LocalDate fecha;

    @Column(name = "total_efectivo", nullable = false)
    private BigDecimal totalEfectivo = BigDecimal.ZERO;

    @Column(name = "total_tarjeta", nullable = false)
    private BigDecimal totalTarjeta = BigDecimal.ZERO;

    @Column(name = "total_transferencia", nullable = false)
    private BigDecimal totalTransferencia = BigDecimal.ZERO;

    @Column(name = "total_egresos", nullable = false)
    private BigDecimal totalEgresos = BigDecimal.ZERO;

    @Column(name = "balance_calculado", nullable = false)
    private BigDecimal balanceCalculado = BigDecimal.ZERO;

    /** Cambio con el que arrancó la caja (lo que quedó del cierre anterior) */
    @Column(name = "fondo_inicial", nullable = false)
    private BigDecimal fondoInicial = BigDecimal.ZERO;

    /** Lo que se dejó en la caja para el día siguiente */
    @Column(name = "deja_en_caja")
    private BigDecimal dejaEnCaja;

    /** Lo que el encargado contó físicamente en la caja */
    @Column(name = "monto_contado")
    private BigDecimal montoContado;

    /** montoContado - balanceCalculado (positivo = sobrante, negativo = faltante) */
    @Column(name = "diferencia")
    private BigDecimal diferencia;

    @Column(name = "cantidad_pagos")
    private int cantidadPagos;

    @Column(columnDefinition = "TEXT")
    private String observaciones;

    @Column(name = "creado_por", length = 100)
    private String creadoPor;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
