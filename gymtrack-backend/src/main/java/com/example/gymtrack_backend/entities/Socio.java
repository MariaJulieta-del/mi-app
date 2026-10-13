package com.example.gymtrack_backend.entities;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Data
@Entity
@Table(name = "socios")
public class Socio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private String apellido;

    @Column(nullable = false, unique = true)
    private String dni;

    private String telefono;
    private String email;
    private LocalDate fechaNacimiento;

    /** FEMENINO, MASCULINO o NO_BINARIO (null = sin dato) */
    @Column(length = 20)
    private String genero;
    private LocalDate fechaInicio;
    private LocalDate fechaVencimiento;
    private String estado; // ACTIVO, INACTIVO

    @Column(nullable = false)
    private Boolean activo = true;

    /** Eligió aparecer en el ranking mensual de entrenamientos */
    @Column(name = "ranking_visible", nullable = false)
    private Boolean rankingVisible = false;

    // Historial: fecha de alta en el sistema (se setea automáticamente)
    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime fechaCreacion;

    // Historial: última vez que se modificó el registro
    @Column(name = "fecha_modificacion")
    private LocalDateTime fechaModificacion;

    @PrePersist
    protected void onCreate() {
        this.fechaCreacion = LocalDateTime.now();
        this.fechaModificacion = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.fechaModificacion = LocalDateTime.now();
    }
}