package com.example.gymtrack_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class DisciplinaRequestDTO {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 60, message = "El nombre puede tener hasta 60 caracteres")
    private String nombre;

    private String descripcion;

    /** Profesor a cargo (opcional) */
    private Long profesorId;

    /** Nombre del instructor si no es un profesor de la app */
    private String instructor;

    /** null = sin límite */
    private Integer cupoMaximo;

    /** 1 a 8 (paleta de la app) */
    private Integer color;

    private Boolean activa = true;

    private List<HorarioDTO> horarios = new ArrayList<>();

    @Data
    public static class HorarioDTO {
        private String dia;
        private String horaInicio;
        private String horaFin;
    }
}
