package com.example.gymtrack_backend.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class DisciplinaResponseDTO {
    private Long id;
    private String nombre;
    private String descripcion;
    /** Nombre a mostrar: el del profesor vinculado o el texto libre */
    private String instructor;
    private Long profesorId;
    private Integer cupoMaximo;
    private Integer color;
    private Boolean activa;
    /** Ordenados de lunes a domingo y por hora */
    private List<DisciplinaRequestDTO.HorarioDTO> horarios;
    /** Socios activos inscriptos (los que ocupan cupo) */
    private int totalInscritos;
    /** Cupos libres; null si no hay límite */
    private Integer cuposDisponibles;
    /** Solo para el staff: quiénes están inscriptos */
    private List<Inscripto> inscriptos;
    /** Solo para un socio: si él está inscripto */
    private Boolean inscripto;

    @Data
    public static class Inscripto {
        private Long socioId;
        private String nombre;
        private boolean activo;
        /** true si tiene la membresía activa y sin vencer */
        private boolean membresiaVigente;
        private LocalDate fechaAlta;
    }
}
