package com.example.gymtrack_backend.dto;

import java.time.LocalDateTime;

public record NotificacionResponseDTO(
        Long id,
        String titulo,
        String mensaje,
        String tipo,
        String destinatario,
        Long socioId,
        Long disciplinaId,
        String disciplinaNombre,
        LocalDateTime fechaCreacion,
        Boolean activa
) {}
