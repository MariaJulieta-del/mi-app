package com.example.gymtrack_backend.entities;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entidad que representa una rutina de entrenamiento.
 * Cada rutina pertenece a un Socio y puede contener múltiples ejercicios.
 */
@Data
@Entity
@Table(name = "rutinas")
public class Rutina {

    // Clave primaria con auto-incremento
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Nombre de la rutina (obligatorio, máx 50 chars)
    @Column(nullable = false, length = 50)
    private String nombre;

    // Descripción opcional de la rutina
    @Column(columnDefinition = "TEXT")
    private String descripcion;

    // Relación ManyToOne: muchas rutinas pertenecen a un Socio (null = rutina general/template)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "socio_id", nullable = true)
    private Socio socio;

    // Fecha de creación: se setea automáticamente al persistir
    @Column(nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    /** Última vez que se cambiaron los ejercicios (desde ahí se cuenta cuánto hace que el socio la hace) */
    @Column(name = "fecha_renovacion")
    private LocalDateTime fechaRenovacion;

    /** Plantilla visible en la app del socio (el profe oculta las que todavía está armando) */
    @Column(name = "visible_socios", nullable = false)
    private Boolean visibleSocios = true;

    /** La eligió el propio socio desde las plantillas (no se la armó un profe) */
    @Column(name = "elegida_por_socio", nullable = false)
    private Boolean elegidaPorSocio = false;

    @Column(name = "plantilla_origen_id")
    private Long plantillaOrigenId;

    /**
     * Se ejecuta antes de insertar en BD.
     * Asigna automáticamente la fecha y hora actual.
     */
    @PrePersist
    protected void onCrear() {
        this.fechaCreacion = LocalDateTime.now();
    }

    /**
     * Trenes musculares que cubre esta rutina.
     * Ej: ["SUPERIOR", "CORE"] — múltiple selección.
     */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "rutina_trenes", joinColumns = @JoinColumn(name = "rutina_id"))
    @Column(name = "tren")
    private List<String> trenes = new ArrayList<>();

    /**
     * Nivel de dificultad de la rutina: BAJA, MEDIA, ALTA.
     * Especialmente útil en rutinas generales para ayudar a los socios a elegir.
     */
    @Column(name = "dificultad", length = 20)
    private String dificultad;

    /** Objetivo: FUERZA, HIPERTROFIA, RESISTENCIA, PERDIDA_GRASA, SALUD (null = sin especificar) */
    @Column(length = 20)
    private String objetivo;

    /** Indicaciones personales del profe para el socio (no se copian a las plantillas) */
    @Column(name = "notas_profe", columnDefinition = "TEXT")
    private String notasProfe;

    /** Días de la semana en que se realiza esta rutina, ej: ["LUNES", "MIÉRCOLES"] */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "rutina_dias", joinColumns = @JoinColumn(name = "rutina_id"))
    @Column(name = "dia")
    private List<String> diasSemana = new ArrayList<>();

    // Relación OneToMany: una rutina puede tener muchos ejercicios
    // (lista de ejercicios se añadirá cuando exista la entidad Ejercicio)
    // @OneToMany(mappedBy = "rutina", cascade = CascadeType.ALL, orphanRemoval = true)
    // private List<Ejercicio> ejercicios;
}
