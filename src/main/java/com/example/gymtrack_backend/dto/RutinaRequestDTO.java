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
    private java.util.List<String> trenes;

    /** Días de la semana asignados, ej: ["Lunes", "Miércoles"] */
    private java.util.List<String> diasSemana;

    /** Nivel de dificultad: BAJA, MEDIA, ALTA */
    private String dificultad;

    /** Objetivo: FUERZA, HIPERTROFIA, RESISTENCIA, PERDIDA_GRASA, SALUD (null = sin especificar) */
    private String objetivo;
    /** Indicaciones personales del profe (rutinas de socio) */
    private String notasProfe;
}
