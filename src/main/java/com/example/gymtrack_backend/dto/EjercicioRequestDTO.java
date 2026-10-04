package com.example.gymtrack_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * DTO para crear o modificar un ejercicio dentro de una rutina.
 */
@Data
public class EjercicioRequestDTO {

    @NotBlank(message = "El nombre del ejercicio es obligatorio")
    @Size(max = 100, message = "El nombre no puede superar los 100 caracteres")
    private String nombreEjercicio;

    private Integer series;

    private Integer repeticiones;

    private Double pesoKg;

    // Si no se provee, el backend lo asigna automáticamente (siguiente disponible)
    private Integer orden;

    // Descanso recomendado entre series (en segundos)
    private Integer descansoSeg;

    @Size(max = 500)
    private String notas;

    /** ID del ejercicio en el catálogo (opcional — para vincular descripción y máquina) */
    private Long ejercicioCatalogoId;

    /** Si true, el ejercicio forma parte del bloque inamovible de Entrada en Calor. */
    private Boolean esCalentamiento;

    /** Día al que pertenece este ejercicio (Día 1, Día 2, etc.). Default 1. */
    private Integer dia;
}
