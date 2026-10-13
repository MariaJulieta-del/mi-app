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
    @jakarta.validation.constraints.NotBlank(message = "El nombre es obligatorio")
    @jakarta.validation.constraints.Size(max = 80, message = "El nombre no puede superar los 80 caracteres")
    private String nombre;
    @jakarta.validation.constraints.NotBlank(message = "El apellido es obligatorio")
    @jakarta.validation.constraints.Size(max = 80, message = "El apellido no puede superar los 80 caracteres")
    private String apellido;
    @jakarta.validation.constraints.NotBlank(message = "El DNI es obligatorio")
    @jakarta.validation.constraints.Pattern(regexp = "\\d{6,10}", message = "El DNI tiene que tener entre 6 y 10 números, sin puntos")
    private String dni;
    @jakarta.validation.constraints.Pattern(regexp = "^$|^[0-9 +()\\-]{6,25}$", message = "El teléfono solo puede tener números, espacios, +, - y paréntesis")
    private String telefono;
    // Vacío (o solo espacios) = sin email; si tiene algo, que sea un email
    @jakarta.validation.constraints.Pattern(regexp = "^\\s*$|^\\s*[^\\s@]+@[^\\s@]+\\.[^\\s@]+\\s*$", message = "El email no es válido")
    @jakarta.validation.constraints.Size(max = 120, message = "El email no puede superar los 120 caracteres")
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
