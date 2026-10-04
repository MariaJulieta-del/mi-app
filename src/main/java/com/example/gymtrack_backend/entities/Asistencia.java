package com.example.gymtrack_backend.entities;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Entity
@Table(name = "asistencias")
public class Asistencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "socio_id", nullable = false)
    private Socio socio;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(nullable = false)
    private LocalTime hora;

    /** ENTRADA o SALIDA */
    @Column(nullable = false)
    private String tipo = "ENTRADA";

    /** true = acceso permitido (membresía activa); false = denegado */
    @Column(nullable = false)
    private Boolean permitido = true;

    private String observacion;
}
