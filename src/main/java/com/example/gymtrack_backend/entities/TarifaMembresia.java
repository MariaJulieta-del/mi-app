package com.example.gymtrack_backend.entities;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "tarifas_membresia")
public class TarifaMembresia {

    @Id
    @Column(name = "tipo", length = 20)
    private String tipo; // MENSUAL, TRIMESTRAL, SEMESTRAL, ANUAL

    @Column(length = 100)
    private String nombre;

    @Column(nullable = false)
    private BigDecimal precio;

    @Column(name = "duracion_dias")
    private Integer duracionDias;

    /** Pases (ingresos) por mes que incluye el plan. NULL = pase libre */
    @Column(name = "pases_mensuales")
    private Integer pasesMensuales;

    private String descripcion;

    private String incluye;

    /** false = ya no se vende (sigue sirviendo a quien lo tiene) */
    @Column(nullable = false)
    private Boolean activo = true;
}
