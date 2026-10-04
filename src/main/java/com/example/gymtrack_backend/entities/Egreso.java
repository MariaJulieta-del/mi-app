package com.example.gymtrack_backend.entities;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "egresos")
@Data
public class Egreso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(nullable = false)
    private String descripcion;

    @Column(nullable = false)
    private BigDecimal monto;

    /** LIMPIEZA, REPARACION, SUMINISTROS, VARIOS */
    @Column(nullable = false)
    private String categoria = "VARIOS";

    @Column(name = "registrado_por")
    private String registradoPor;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
