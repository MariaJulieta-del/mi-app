package com.example.gymtrack_backend.entities;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Una plantilla asignada a un socio. No copia los ejercicios: el socio hace la plantilla tal cual
 * (si el profe la cambia, le llegan los cambios). Para ajustarla solo para él, se personaliza (se copia).
 */
@Data
@Entity
@Table(name = "rutina_asignaciones", uniqueConstraints = @UniqueConstraint(columnNames = {"rutina_id", "socio_id"}))
public class RutinaAsignacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** La plantilla (rutina sin socio) */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "rutina_id")
    private Rutina rutina;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "socio_id")
    private Socio socio;

    /** Desde cuándo la hace (para contar las semanas hasta renovarla) */
    @Column(name = "fecha_asignacion", nullable = false)
    private LocalDateTime fechaAsignacion;

    @Column(name = "asignada_por", length = 50)
    private String asignadaPor;

    /** La eligió el propio socio desde su app */
    @Column(name = "elegida_por_socio", nullable = false)
    private Boolean elegidaPorSocio = false;
}
