package com.example.gymtrack_backend.dto;

import com.example.gymtrack_backend.entities.enums.MetodoPago;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * DTO para registrar un pago y asignar un plan de membresía a un socio
 * en una única operación atómica desde el módulo de Pagos.
 */
@Data
public class PagoConMembresiaRequestDTO {

    @NotNull(message = "El ID del socio es obligatorio")
    private Long socioId;

    @NotBlank(message = "El tipo de plan es obligatorio")
    private String planTipo; // Referencia a tarifas_membresia.tipo

    @NotNull(message = "El método de pago es obligatorio")
    private MetodoPago metodoPago;

    @jakarta.validation.constraints.Size(max = 300, message = "Las observaciones no pueden superar los 300 caracteres")
    private String observaciones;
}
