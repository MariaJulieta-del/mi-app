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
    private long sociosActivos;
    /** false = deshabilitado: no se ofrece al cobrar */
    private boolean activo;
    /** true si algún socio tuvo este plan (entonces no se puede borrar, solo deshabilitar) */
    private boolean usado; // cantidad de socios con membresía activa de este tipo
}
