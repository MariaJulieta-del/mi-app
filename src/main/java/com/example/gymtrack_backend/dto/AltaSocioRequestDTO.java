package com.example.gymtrack_backend.dto;

import lombok.Data;
import java.time.LocalDate;

/**
 * DTO para el alta completa de un socio: datos personales + plan + forma de pago.
 * Siempre genera membresía ACTIVA + pago COMPLETADO en una transacción (no existe el fiado).
 */
@Data
public class AltaSocioRequestDTO {

    // ── Datos personales ──────────────────────────────
    private String nombre;
    private String apellido;
    private String dni;
    private String telefono;
    private String email;
    private LocalDate fechaNacimiento;
    /** FEMENINO, MASCULINO o NO_BINARIO (opcional) */
    private String genero;

    // ── Membresía ─────────────────────────────────────
    /** Tipo de plan según tarifas_membresia.tipo (ej: "MENSUAL", "TRIMESTRAL") */
    private String tipoMembresia;

    /**
     * Forma de pago: EFECTIVO | TARJETA | TRANSFERENCIA
     */
    private String formaDePago;
}
