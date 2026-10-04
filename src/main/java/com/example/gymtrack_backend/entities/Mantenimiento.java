package com.example.gymtrack_backend.entities;

import com.example.gymtrack_backend.entities.enums.TipoMantenimiento;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "mantenimientos")
public class Mantenimiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Máquina a la que corresponde este mantenimiento */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "maquina_id", nullable = false)
    private Maquina maquina;

    /** PENDIENTE = requerido/no hecho, REALIZADO = ya ejecutado */
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false)
    private TipoMantenimiento tipo;

    /** Descripción del trabajo a realizar o realizado */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String descripcion;

    /** Fecha en que se realizó (o se programa) el mantenimiento */
    @Column(name = "fecha_mantenimiento")
    private LocalDate fechaMantenimiento;

    /** Técnico o responsable del mantenimiento */
    @Column(name = "tecnico", length = 200)
    private String tecnico;

    /** Costo del mantenimiento (opcional) */
    @Column(name = "costo")
    private java.math.BigDecimal costo;

    /** Observaciones adicionales */
    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    /** Fecha en que la máquina volvió a estar operativa (calculado: fechaAlta - fechaMantenimiento = inactividad) */
    @Column(name = "fecha_alta")
    private LocalDate fechaAlta;

    /** Teléfono o contacto del técnico */
    @Column(name = "telefono_tecnico", length = 60)
    private String telefonoTecnico;

    @CreationTimestamp
    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime fechaCreacion;
}
