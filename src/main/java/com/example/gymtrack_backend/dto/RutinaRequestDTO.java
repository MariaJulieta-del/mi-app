package com.example.gymtrack_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * DTO que recibe el frontend al crear o actualizar una rutina.
 * Contiene validaciones sobre los campos de entrada.
 */
@Data
public class RutinaRequestDTO {

    // Nombre obligatorio, entre 3 y 50 caracteres
    @NotBlank(message = "El nombre es obligatorio")
    @Size(min = 3, max = 50, message = "El nombre debe tener entre 3 y 50 caracteres")
    private String nombre;

    // Descripción opcional, máximo 500 caracteres
    @Size(max = 500, message = "La descripción no puede superar los 500 caracteres")
    private String descripcion;

    /** Trenes musculares — múltiple selección: ["SUPERIOR", "CORE", ...] */
    @Size(max = 8, message = "Demasiadas zonas")
    private java.util.List<@jakarta.validation.constraints.Pattern(regexp = "[A-Z_]{2,20}", message = "Zona inválida") String> trenes;

    /** Días de la semana asignados, ej: ["Lunes", "Miércoles"] */
    @Size(max = 7, message = "Una semana tiene 7 días")
    private java.util.List<@jakarta.validation.constraints.Pattern(regexp = "Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo", message = "Día inválido") String> diasSemana;

    /** Nivel de dificultad: BAJA, MEDIA, ALTA */
    @jakarta.validation.constraints.Pattern(regexp = "^$|BAJA|MEDIA|ALTA", message = "Dificultad inválida")
    private String dificultad;

    /** Objetivo: FUERZA, HIPERTROFIA, RESISTENCIA, PERDIDA_GRASA, SALUD (null = sin especificar) */
    @Size(max = 20, message = "Objetivo inválido")
    private String objetivo;
    /** Indicaciones personales del profe (rutinas de socio) */
    @Size(max = 1000, message = "Las indicaciones no pueden superar los 1000 caracteres")
    private String notasProfe;
}
