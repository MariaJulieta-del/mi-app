package com.example.gymtrack_backend.dto;

import com.example.gymtrack_backend.entities.enums.MetodoPago;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

/**
 * DTO para registrar un nuevo pago.
 */
@Data
public class PagoRequestDTO {

    @NotNull(message = "El ID de la membresía es obligatorio")
    private Long membresiaId;

    @NotNull(message = "El monto es obligatorio")
    @DecimalMin(value = "0.01", message = "El monto debe ser mayor a cero")
    private BigDecimal monto;

    @NotNull(message = "El método de pago es obligatorio")
    private MetodoPago metodoPago;

    // Observaciones opcionales
    private String observaciones;
}
