package com.example.gymtrack_backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class NotificacionRequestDTO {
    @NotBlank
    private String titulo;
    @NotBlank
    private String mensaje;
    private String tipo        = "AVISO";
    private String destinatario = "TODOS";
    private Long   socioId;
    /** Aviso a los alumnos de una clase */
    private Long   disciplinaId;
    /** Mandarlo también por mail (por defecto sí) */
    private Boolean porEmail = true;
    /** Preparar los links de WhatsApp */
    private Boolean porWhatsapp = false;
}
