package com.example.gymtrack_backend.dto;

import lombok.Data;

/**
 * DTO que el backend devuelve con los datos de un ejercicio de rutina.
 */
@Data
public class EjercicioResponseDTO {

    private Long id;
    private String nombreEjercicio;
    private Integer series;
    private Integer repeticiones;
    private Double pesoKg;
    private Integer orden;
    private Integer descansoSeg;
    private String notas;

    // Info del catálogo (presente solo si el ejercicio está vinculado)
    private Long ejercicioCatalogoId;
    private Boolean esMaquina;
    private String descripcionEjercicio;
    private java.util.List<String> grupos;
    private String imagenUrl;
    private java.util.List<Long> maquinaIds;

    /** true → pertenece al bloque inamovible de Entrada en Calor */
    private boolean esCalentamiento;

    /** Día al que pertenece este ejercicio dentro de la rutina (1, 2, 3...) */
    private Integer dia;
}
