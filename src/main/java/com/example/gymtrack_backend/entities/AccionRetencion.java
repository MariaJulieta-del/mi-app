package com.example.gymtrack_backend.entities;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Algo para hacer con un socio para que no se vaya (o para que vuelva):
 * un aviso automático en su app o una tarea para el staff (escribirle por WhatsApp).
 */
@Data
@Entity
@Table(name = "acciones_retencion")
public class AccionRetencion {

    public static final String PENDIENTE = "PENDIENTE";
    public static final String HECHA = "HECHA";
    public static final String DESCARTADA = "DESCARTADA";
    /** Aviso que se le mandó solo al socio en la app (no requiere nada del staff) */
    public static final String AUTOMATICA = "AUTOMATICA";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "socio_id")
    private Socio socio;

    @Column(nullable = false, length = 30)
    private String tipo;

    @Column(nullable = false, length = 15)
    private String estado;

    @Column(columnDefinition = "TEXT")
    private String mensaje;

    @Column(nullable = false)
    private LocalDateTime creada = LocalDateTime.now();

    private LocalDateTime resuelta;

    @Column(name = "resuelta_por", length = 100)
    private String resueltaPor;
}
