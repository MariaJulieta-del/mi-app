package com.example.gymtrack_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * DTO para crear o modificar un ejercicio dentro de una rutina.
 */
@Data
public class EjercicioRequestDTO {

    /** Solo para guardar todos juntos: id del ejercicio que ya estaba en la rutina */
    private Long id;

    @NotBlank(message = "El nombre del ejercicio es obligatorio")
    @Size(max = 100, message = "El nombre no puede superar los 100 caracteres")
    private String nombreEjercicio;

    @jakarta.validation.constraints.Min(value = 1, message = "Las series van de 1 a 20") @jakarta.validation.constraints.Max(value = 20, message = "Las series van de 1 a 20")
    private Integer series;

    @jakarta.validation.constraints.Min(value = 1, message = "Las repeticiones van de 1 a 200") @jakarta.validation.constraints.Max(value = 200, message = "Las repeticiones van de 1 a 200")
    private Integer repeticiones;

    @jakarta.validation.constraints.DecimalMin(value = "0", message = "El peso no puede ser negativo") @jakarta.validation.constraints.DecimalMax(value = "1000", message = "El peso no puede superar 1000 kg")
    private Double pesoKg;

    // Si no se provee, el backend lo asigna automáticamente (siguiente disponible)
    @jakarta.validation.constraints.Min(0) @jakarta.validation.constraints.Max(500)
    private Integer orden;

    // Descanso recomendado entre series (en segundos)
    @jakarta.validation.constraints.Min(value = 0, message = "El descanso no puede ser negativo") @jakarta.validation.constraints.Max(value = 900, message = "El descanso no puede superar 15 minutos")
    private Integer descansoSeg;

    @Size(max = 500)
    private String notas;

    /** ID del ejercicio en el catálogo (opcional — para vincular descripción y máquina) */
    private Long ejercicioCatalogoId;

    /** Si true, el ejercicio forma parte del bloque inamovible de Entrada en Calor. */
    private Boolean esCalentamiento;

    /** Día al que pertenece este ejercicio (Día 1, Día 2, etc.). Default 1. */
    @jakarta.validation.constraints.Min(value = 1, message = "El día va de 1 a 7") @jakarta.validation.constraints.Max(value = 7, message = "El día va de 1 a 7")
    private Integer dia;
}
