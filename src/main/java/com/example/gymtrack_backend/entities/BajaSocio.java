package com.example.gymtrack_backend.entities;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Registro de cada baja de un socio con su motivo.
 * Sirve para ver por qué se van los socios y tomar decisiones; queda aunque se reactive o se elimine.
 */
@Data
@Entity
@Table(name = "bajas_socios")
public class BajaSocio {

    /** Motivos que se pueden elegir al dar de baja */
    public static final java.util.Set<String> MOTIVOS = java.util.Set.of(
            "PRECIO", "HORARIOS", "FALTA_TIEMPO", "MUDANZA", "SALUD", "SIN_RESULTADOS",
            "ATENCION", "INSTALACIONES", "OTRO_GIMNASIO", "OTRO", "SIN_ESPECIFICAR");

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** null si el socio se eliminó después */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "socio_id")
    private Socio socio;

    @Column(name = "socio_nombre", nullable = false)
    private String socioNombre;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @Column(nullable = false, length = 40)
    private String motivo;

    @Column(columnDefinition = "TEXT")
    private String detalle;

    @Column(name = "registrado_por", length = 100)
    private String registradoPor;
}
