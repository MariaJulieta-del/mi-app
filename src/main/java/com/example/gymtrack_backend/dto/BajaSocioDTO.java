package com.example.gymtrack_backend.dto;

import java.time.LocalDateTime;

/** Una baja de socio con su motivo (para la lista de socios y los reportes) */
public record BajaSocioDTO(
        Long id,
        Long socioId,
        String socioNombre,
        /** true si el socio volvió (se reactivó después de esta baja) */
        boolean socioActivo,
        LocalDateTime fecha,
        String motivo,
        String detalle,
        String registradoPor
) {}
