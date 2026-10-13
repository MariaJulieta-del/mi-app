package com.example.gymtrack_backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class MantenimientoResponseDTO {
    private Long id;
    private Long maquinaId;
    private String maquinaNombre;
    private String maquinaNroMaquina;
    private String tipo;
    /** "PREVENTIVO" | "CORRECTIVO" (opcional) */
    private String categoria;
    private String descripcion;
    private LocalDate fechaMantenimiento;
    private String tecnico;
    private BigDecimal costo;
    private String observaciones;
    private LocalDateTime fechaCreacion;
    private LocalDate fechaAlta;
    private String telefonoTecnico;
    /** Días que la máquina estuvo fuera de servicio (fechaAlta - fechaMantenimiento), null si no se completó */
    private Long diasInactividad;

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getMaquinaId() { return maquinaId; }
    public void setMaquinaId(Long maquinaId) { this.maquinaId = maquinaId; }

    public String getMaquinaNombre() { return maquinaNombre; }
    public void setMaquinaNombre(String maquinaNombre) { this.maquinaNombre = maquinaNombre; }

    public String getMaquinaNroMaquina() { return maquinaNroMaquina; }
    public void setMaquinaNroMaquina(String maquinaNroMaquina) { this.maquinaNroMaquina = maquinaNroMaquina; }

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

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public LocalDate getFechaAlta() { return fechaAlta; }
    public void setFechaAlta(LocalDate fechaAlta) { this.fechaAlta = fechaAlta; }

    public String getTelefonoTecnico() { return telefonoTecnico; }
    public void setTelefonoTecnico(String telefonoTecnico) { this.telefonoTecnico = telefonoTecnico; }

    public Long getDiasInactividad() { return diasInactividad; }
    public void setDiasInactividad(Long diasInactividad) { this.diasInactividad = diasInactividad; }
}
