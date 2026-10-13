package com.example.gymtrack_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class MaquinaEstadisticasDTO {
    private Long    maquinaId;
    private String  maquinaNombre;
    private String  maquinaNroMaquina;
    /** Cantidad de reparaciones completadas (tipo=REALIZADO) */
    private int     totalReparaciones;
    /** Costo total invertido en reparaciones */
    private BigDecimal costoTotal;
    /** Días totales de inactividad acumulados */
    private long    diasInactividadTotal;
    /** Promedio de días de inactividad por reparación (0 si no hay datos) */
    private double  diasInactividadPromedio;
}
