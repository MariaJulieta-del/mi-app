package com.example.gymtrack_backend.dto;

import com.example.gymtrack_backend.entities.enums.EstadoMembresia;
import com.example.gymtrack_backend.entities.enums.EstadoPago;
import com.example.gymtrack_backend.entities.enums.MetodoPago;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO que devuelve el backend con los datos de un pago.
 */
@Data
public class PagoResponseDTO {

    private Long id;
    private Long membresiaId;
    private Long socioId;
    private String socioNombre;
    private String tipoMembresia;       // Plan asociado al pago
    private EstadoMembresia estadoMembresia; // Estado actual de la membresía
    private BigDecimal monto;
    private MetodoPago metodoPago;
    private EstadoPago estadoPago;
    private LocalDateTime fechaPago;
    private String observaciones;
}
