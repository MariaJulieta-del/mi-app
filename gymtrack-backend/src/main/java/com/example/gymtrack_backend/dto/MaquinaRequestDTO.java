package com.example.gymtrack_backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MaquinaRequestDTO {
    /** Opcional — barras, mancuernas y accesorios no necesitan número */
    private String nroMaquina;
    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;
    private String descripcion;
    /** Grupos musculares (mismo vocabulario que Ejercicio) */
    private java.util.List<String> grupos;
    private String instruccionesUso;
    private String ajustes;
    private Boolean activa = true;
}
