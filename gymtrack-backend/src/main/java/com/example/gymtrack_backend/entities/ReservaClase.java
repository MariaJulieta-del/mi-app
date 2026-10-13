package com.example.gymtrack_backend.entities;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Reserva de un lugar en una clase puntual (disciplina + fecha + horario).
 * Los alumnos fijos (inscriptos) ocupan su lugar todas las semanas; si un día no van, "liberan" el lugar.
 */
@Data
@Entity
@Table(name = "reservas_clase")
public class ReservaClase {

    public static final String CONFIRMADA = "CONFIRMADA";
    public static final String ESPERA = "ESPERA";
    public static final String CANCELADA = "CANCELADA";
    /** Alumno fijo que avisó que ese día no va */
    public static final String LIBERADA = "LIBERADA";
    public static final String ASISTIO = "ASISTIO";
    public static final String AUSENTE = "AUSENTE";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "disciplina_id")
    private Disciplina disciplina;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "socio_id")
    private Socio socio;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(name = "hora_inicio", nullable = false, length = 5)
    private String horaInicio;

    @Column(nullable = false, length = 20)
    private String estado;

    @Column(nullable = false)
    private LocalDateTime creada = LocalDateTime.now();

    private LocalDateTime actualizada;
}
