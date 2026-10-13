package com.example.gymtrack_backend.dto;

import lombok.Data;

@Data
public class FichaMedicaRequestDTO {
    private String lesiones;
    private String nivelAptitud;
    private String historialGimnasio;
    private String disponibilidad;
    private String observacionesMedicas;
}
