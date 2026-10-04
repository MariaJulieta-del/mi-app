package com.example.gymtrack_backend.entities;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "progreso_ejercicio")
public class ProgresoEjercicio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "socio_id", nullable = false)
    private Socio socio;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rutina_ejercicio_id", nullable = false)
    private RutinaEjercicio rutinaEjercicio;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(name = "peso_kg", precision = 6, scale = 2)
    private BigDecimal pesoKg;

    @Column(name = "repeticiones_reales")
    private Integer repeticionesReales;

    @Column(name = "series_realizadas")
    private Integer seriesRealizadas;

    @Column(columnDefinition = "TEXT")
    private String observacion;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
