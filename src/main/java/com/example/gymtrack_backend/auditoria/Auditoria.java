package com.example.gymtrack_backend.auditoria;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** Registro de quién hizo qué: cobros, bajas, cambios de planes, ediciones de fichas, etc. */
@Entity
@Table(name = "auditoria", indexes = {
        @Index(name = "ix_auditoria_fecha", columnList = "fecha"),
        @Index(name = "ix_auditoria_socio", columnList = "socio_id")
})
@Getter @Setter @NoArgsConstructor
public class Auditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @Column(nullable = false, length = 50)
    private String usuario;

    @Column(length = 20)
    private String rol;

    /** Qué hizo, en palabras: "Cobró un plan", "Dio de baja al socio"… */
    @Column(nullable = false, length = 120)
    private String accion;

    /** Datos extra (plan y monto, estado nuevo…) */
    @Column(length = 500)
    private String detalle;

    /** Método y ruta de la API, para rastrear */
    @Column(length = 200)
    private String recurso;

    @Column(name = "socio_id")
    private Long socioId;

    @Column(length = 120)
    private String socioNombre;

    @Column(length = 64)
    private String ip;
}
