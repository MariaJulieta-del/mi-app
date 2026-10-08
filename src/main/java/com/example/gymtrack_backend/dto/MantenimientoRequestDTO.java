package com.example.gymtrack_backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class MantenimientoRequestDTO {
    private Long maquinaId;
    private String tipo;          // "PENDIENTE" | "REALIZADO"
    /** "PREVENTIVO" | "CORRECTIVO" (opcional) */
    private String categoria;
    private String descripcion;
    private LocalDate fechaMantenimiento;
    private String tecnico;
    private BigDecimal costo;
    private String observaciones;
    private LocalDate fechaAlta;
    private String telefonoTecnico;

    // Getters & Setters
    public Long getMaquinaId() { return maquinaId; }
    public void setMaquinaId(Long maquinaId) { this.maquinaId = maquinaId; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public LocalDate getFechaMantenimiento() { return fechaMantenimiento; }
    public void setFechaMantenimiento(LocalDate fechaMantenimiento) { this.fechaMantenimiento = fechaMantenimiento; }

    public String getTecnico() { return tecnico; }
    public void setTecnico(String tecnico) { this.tecnico = tecnico; }

    public BigDecimal getCosto() { return costo; }
    public void setCosto(BigDecimal costo) { this.costo = costo; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

    public LocalDate getFechaAlta() { return fechaAlta; }
    public void setFechaAlta(LocalDate fechaAlta) { this.fechaAlta = fechaAlta; }

    public String getTelefonoTecnico() { return telefonoTecnico; }
    public void setTelefonoTecnico(String telefonoTecnico) { this.telefonoTecnico = telefonoTecnico; }
}
