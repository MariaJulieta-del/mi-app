package com.example.gymtrack_backend.entities;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** Recordatorio de vencimiento que ya se le mandó a un socio (para no repetirlo) */
@Data
@Entity
@Table(name = "recordatorios_cuota")
public class RecordatorioCuota {

    /** Antes de que venza */
    public static final String ANTES = "ANTES";
    /** Cuando ya venció */
    public static final String VENCIDA = "VENCIDA";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "socio_id")
    private Socio socio;

    @Column(name = "fecha_vencimiento", nullable = false)
    private LocalDate fechaVencimiento;

    @Column(nullable = false, length = 10)
    private String tipo;

    @Column(nullable = false)
    private LocalDateTime enviado;

    @Column(name = "por_mail", nullable = false)
    private Boolean porMail = false;
}
