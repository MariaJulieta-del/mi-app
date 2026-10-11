package com.example.gymtrack_backend.dto;

import lombok.Data;

/**
 * DTO para actualizar series/reps/peso/descanso/notas de un ejercicio en una rutina.
 * Todos los campos son opcionales — solo se actualizan los que llegan no nulos.
 */
@Data
public class EjercicioUpdateDTO {
    @jakarta.validation.constraints.Min(value = 1, message = "Las series van de 1 a 20") @jakarta.validation.constraints.Max(value = 20, message = "Las series van de 1 a 20")
    private Integer series;
    @jakarta.validation.constraints.Min(value = 1, message = "Las repeticiones van de 1 a 200") @jakarta.validation.constraints.Max(value = 200, message = "Las repeticiones van de 1 a 200")
    private Integer repeticiones;
    @jakarta.validation.constraints.DecimalMin(value = "0", message = "El peso no puede ser negativo") @jakarta.validation.constraints.DecimalMax(value = "1000", message = "El peso no puede superar 1000 kg")
    private Double  pesoKg;
    @jakarta.validation.constraints.Min(value = 0, message = "El descanso no puede ser negativo") @jakarta.validation.constraints.Max(value = 900, message = "El descanso no puede superar 15 minutos")
    private Integer descansoSeg;
    @jakarta.validation.constraints.Size(max = 500, message = "Las notas no pueden superar los 500 caracteres")
    private String  notas;
}
