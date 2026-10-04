package com.example.gymtrack_backend.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class TarifaMembresiaResponseDTO {
    private String tipo;
    private String nombre;
    private BigDecimal precio;
    private Integer duracionDias;
    private Integer pasesMensuales; // null = pase libre
    private String descripcion;
    private String incluye;
    private long sociosActivos; // cantidad de socios con membresía activa de este tipo
}
