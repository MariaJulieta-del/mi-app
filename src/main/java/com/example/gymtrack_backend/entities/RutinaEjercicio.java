package com.example.gymtrack_backend.entities;

import jakarta.persistence.*;
import lombok.Data;

/**
 * Entidad de unión N:N entre Rutina y Ejercicio.
 * Almacena los ejercicios que forman parte de una rutina,
 * con sus parámetros específicos (series, reps, peso, orden).
 *
 * Mientras no exista la entidad Ejercicio, se guarda el nombre
 * como texto libre. Se puede refactorizar luego con FK real.
 */
@Data
@Entity
@Table(name = "rutina_ejercicios")
public class RutinaEjercicio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Relación con la rutina a la que pertenece este ejercicio
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rutina_id", nullable = false)
    private Rutina rutina;

    // Nombre del ejercicio (texto libre por ahora; reemplazar por FK cuando exista Ejercicio)
    @Column(name = "nombre_ejercicio", nullable = false, length = 100)
    private String nombreEjercicio;

    // Número de series
    @Column
    private Integer series;

    // Número de repeticiones por serie
    @Column
    private Integer repeticiones;

    // Peso en kilogramos (null si es ejercicio sin peso)
    @Column(name = "peso_kg")
    private Double pesoKg;

    // Orden de ejecución dentro de la rutina (1, 2, 3...)
    @Column(nullable = false)
    private Integer orden;

    // Tiempo de descanso recomendado entre series (en segundos)
    @Column(name = "descanso_seg")
    private Integer descansoSeg;

    // Notas opcionales (ej: "peso recomendado: 60-70% 1RM")
    @Column(columnDefinition = "TEXT")
    private String notas;

    // Vínculo opcional al catálogo de ejercicios (para mostrar descripción, máquina, etc.)
    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "ejercicio_catalogo_id", nullable = true)
    private Ejercicio ejercicioCatalogo;

    /**
     * true → este ejercicio pertenece al bloque de Entrada en Calor.
     * No puede eliminarse por el usuario; siempre se renderiza primero.
     */
    @Column(name = "es_calentamiento", nullable = false)
    private boolean esCalentamiento = false;

    /** Día al que pertenece este ejercicio dentro de la rutina (Día 1, Día 2, etc.) */
    @Column(nullable = false)
    private Integer dia = 1;
}
