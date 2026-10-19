package com.example.gymtrack_backend.dto;

import java.time.LocalDateTime;

/** Un socio que tiene asignada una plantilla */
public record AsignacionDTO(
        Long plantillaId,
        String plantillaNombre,
        Long socioId,
        String socioNombre,
        LocalDateTime fechaAsignacion,
        /* desde cuándo la hace tal como está (asignación o último cambio de la plantilla) */
        LocalDateTime desde,
        long semanas,
        int semanasMax,
        boolean paraRenovar,
        boolean elegidaPorSocio,
        String asignadaPor) {
}
