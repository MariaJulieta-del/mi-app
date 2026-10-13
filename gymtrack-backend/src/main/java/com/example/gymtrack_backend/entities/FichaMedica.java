package com.example.gymtrack_backend.entities;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "fichas_medicas")
public class FichaMedica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "socio_id", unique = true, nullable = false)
    private Socio socio;

    @Column(columnDefinition = "TEXT")
    private String lesiones;

    /** PRINCIPIANTE, INTERMEDIO, AVANZADO */
    private String nivelAptitud = "PRINCIPIANTE";

    @Column(columnDefinition = "TEXT")
    private String historialGimnasio;

    /** Ej: "Lunes, Miércoles y Viernes mañana" */
    private String disponibilidad;

    @Column(columnDefinition = "TEXT")
    private String observacionesMedicas;

    private LocalDate fechaActualizacion;

    @PrePersist
    @PreUpdate
    void onUpdate() { this.fechaActualizacion = LocalDate.now(); }
}
