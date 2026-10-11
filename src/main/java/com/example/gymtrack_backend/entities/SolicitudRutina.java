package com.example.gymtrack_backend.entities;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/** Pedido de rutina personalizada que hace un socio desde su app. Queda como tarea del staff hasta resolverse. */
@Data
@Entity
@Table(name = "solicitudes_rutina")
public class SolicitudRutina {

    public static final String PENDIENTE = "PENDIENTE";
    public static final String EN_CURSO = "EN_CURSO";
    public static final String HECHA = "HECHA";
    public static final String DESCARTADA = "DESCARTADA";
    public static final String CANCELADA = "CANCELADA";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "socio_id")
    private Socio socio;

    @Column(length = 20)
    private String objetivo;

    @Column(name = "dias_semana")
    private Integer diasSemana;

    @Column(length = 500)
    private String mensaje;

    @Column(nullable = false, length = 12)
    private String estado = PENDIENTE;

    @Column(nullable = false)
    private LocalDateTime creada;

    @Column(name = "tomada_por", length = 50)
    private String tomadaPor;

    private LocalDateTime tomada;
    private LocalDateTime resuelta;

    @Column(name = "resuelta_por", length = 50)
    private String resueltaPor;

    @Column(name = "rutina_id")
    private Long rutinaId;

    /** Por qué se descartó (se le muestra al socio) */
    @Column(length = 300)
    private String motivo;

    public boolean abierta() {
        return PENDIENTE.equals(estado) || EN_CURSO.equals(estado);
    }
}
