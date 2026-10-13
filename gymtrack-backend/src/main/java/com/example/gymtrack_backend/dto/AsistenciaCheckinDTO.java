package com.example.gymtrack_backend.dto;

import lombok.Data;

/** Request para registrar el ingreso de un socio */
@Data
public class AsistenciaCheckinDTO {
    /** Se puede buscar por DNI o por ID numérico */
    private String dni;
    private Long   socioId;
    /** ENTRADA (por defecto) o SALIDA */
    private String tipo = "ENTRADA";
}
