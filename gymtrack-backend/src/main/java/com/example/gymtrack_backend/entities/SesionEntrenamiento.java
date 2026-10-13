package com.example.gymtrack_backend.entities;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** Un entrenamiento terminado desde "Entrenar", con lo que el socio le cuenta al profe */
@Data
@Entity
@Table(name = "sesiones_entrenamiento")
public class SesionEntrenamiento {

    /** Cómo se sintió el socio */
    public static final java.util.Set<String> SENSACIONES = java.util.Set.of("MUY_FACIL", "BIEN", "DURO", "MUY_DURO");

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "socio_id")
    private Socio socio;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rutina_id")
    private Rutina rutina;

    @Column(name = "rutina_nombre")
    private String rutinaNombre;

    private Integer dia;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(name = "duracion_min")
    private Integer duracionMin;

    private Integer series;

    @Column(name = "volumen_kg", precision = 12, scale = 1)
    private BigDecimal volumenKg;

    /** Récords personales que batió en este entrenamiento */
    @Column(nullable = false)
    private Integer records = 0;

    @Column(length = 20)
    private String sensacion;

    @Column(columnDefinition = "TEXT")
    private String comentario;

    /** El profe ya la vio */
    @Column(nullable = false)
    private Boolean leida = false;

    @Column(nullable = false)
    private LocalDateTime creada = LocalDateTime.now();
}
