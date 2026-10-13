package com.example.gymtrack_backend.entities.enums;

/**
 * Estados posibles de la membresía de un socio.
 * Cada socio tiene UNA sola membresía que se renueva pagando (no existe el "fiado").
 */
public enum EstadoMembresia {
    ACTIVA,          // Pagada y dentro del período de vigencia
    VENCIDA,         // La fechaVencimiento ya pasó → hay que renovar
    CANCELADA        // Dada de baja manualmente
}
