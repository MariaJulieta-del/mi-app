package com.example.gymtrack_backend.entities;

import com.example.gymtrack_backend.entities.enums.EstadoMembresia;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Membresía de un socio en el gimnasio. Cada socio tiene UNA sola membresía:
 * al renovar se extiende el vencimiento y el historial queda en los pagos.
 */
@Data
@Entity
@Table(name = "membresias")
public class Membresia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Socio al que pertenece la membresía
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "socio_id", nullable = false)
    private Socio socio;

    // Tipo de membresía — referencia a tarifas_membresia.tipo
    @Column(name = "tipo_membresia", nullable = false, length = 50)
    private String tipoMembresia;

    // Estado actual de la membresía
    @Enumerated(EnumType.STRING)
    @Column(name = "estado_membresia", nullable = false, length = 20)
    private EstadoMembresia estadoMembresia = EstadoMembresia.ACTIVA;

    // Fecha desde la cual la membresía es válida
    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;

    // Fecha calculada: fechaInicio + duración según TipoMembresia
    @Column(name = "fecha_vencimiento", nullable = false)
    private LocalDate fechaVencimiento;

    // Precio cobrado (puede variar con promociones)
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal precio;

    /**
     * Pases por mes, copiados del plan al momento de pagar/renovar.
     * NULL = pase libre (sin límite de ingresos). El cálculo vive en MembresiaService.calcularPases().
     */
    @Column(name = "pases_mensuales")
    private Integer pasesMensuales;

    // Registro de cuándo se creó
    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @PrePersist
    protected void onCreate() {
        this.fechaCreacion = LocalDateTime.now();
    }
}
