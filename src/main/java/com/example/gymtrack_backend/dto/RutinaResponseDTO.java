package com.example.gymtrack_backend.dto;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * DTO que el backend devuelve al frontend con los datos de una rutina.
 * Evita exponer la entidad completa (incluyendo la relación con Socio).
 */
@Data
public class RutinaResponseDTO {

    private Long id;

    private String nombre;

    private String descripcion;

    // Solo se devuelve el ID del socio, no el objeto completo
    private Long socioId;

    /** Nombre completo del socio (null para rutinas genéricas) */
    private String socioNombre;

    private LocalDateTime fechaCreacion;

    private java.util.List<String> trenes;

    private java.util.List<String> diasSemana;

    /** Nivel de dificultad: BAJA, MEDIA, ALTA */
    private String dificultad;

    /** Objetivo: FUERZA, HIPERTROFIA, RESISTENCIA, PERDIDA_GRASA, SALUD (null = sin especificar) */
    private String objetivo;

    /** Ejercicios de la rutina, sin contar la entrada en calor */
    private int cantidadEjercicios;

    /** Cantidad de días distintos (Día 1, Día 2…) que tiene la rutina */
    private int cantidadDias;
}
