package com.example.gymtrack_backend.entities;

import com.example.gymtrack_backend.entities.enums.EstadoPago;
import com.example.gymtrack_backend.entities.enums.MetodoPago;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Registro de un pago asociado a una membresía.
 * Cada pago renueva la membresía del socio (MembresiaService.renovar).
 */
@Data
@Entity
@Table(name = "pagos")
public class Pago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Membresía a la que corresponde el pago
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "membresia_id", nullable = false)
    private Membresia membresia;

    // Monto pagado
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal monto;

    // Método utilizado para el pago
    @Enumerated(EnumType.STRING)
    @Column(name = "metodo_pago", nullable = false, length = 20)
    private MetodoPago metodoPago;

    // Estado del pago
    @Enumerated(EnumType.STRING)
    @Column(name = "estado_pago", nullable = false, length = 20)
    private EstadoPago estadoPago = EstadoPago.COMPLETADO;

    // Fecha y hora en que se registró el pago
    @Column(name = "fecha_pago", nullable = false, updatable = false)
    private LocalDateTime fechaPago;

    // Observaciones opcionales (ej: "comprobante #123", "pago parcial")
    @Column(columnDefinition = "TEXT")
    private String observaciones;

    /** Clave del intento de cobro (la manda la pantalla): repetirla no registra otro pago */
    @Column(name = "clave_idempotencia", length = 64, unique = true)
    private String claveIdempotencia;

    /** Plan que se cobró (la membresía puede cambiar de plan después) */
    @Column(name = "tipo_plan", length = 20)
    private String tipoPlan;

    @PrePersist
    protected void onCreate() {
        this.fechaPago = LocalDateTime.now();
    }
}
