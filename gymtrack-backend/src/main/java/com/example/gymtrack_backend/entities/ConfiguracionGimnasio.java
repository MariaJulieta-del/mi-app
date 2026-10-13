package com.example.gymtrack_backend.entities;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/** Marca del gimnasio (nombre, logo y color). Hay una sola fila, con id 1. */
@Data
@Entity
@Table(name = "configuracion_gimnasio")
public class ConfiguracionGimnasio {

    public static final long ID = 1L;

    @Id
    private Long id = ID;

    @Column(nullable = false, length = 80)
    private String nombre = "GymTrack";

    /** Imagen como data URL (PNG, JPG, SVG o WEBP, chica) */
    @Column(columnDefinition = "TEXT")
    private String logo;

    /** Color principal en formato #RRGGBB (null = el verde de GymTrack) */
    @Column(name = "color_acento", length = 7)
    private String colorAcento;

    private LocalDateTime actualizado;

    /** Semanas que un socio puede hacer la misma rutina antes de renovarla */
    @Column(name = "semanas_rutina", nullable = false)
    private Integer semanasRutina = 6;

    // ── Recordatorio automático de vencimiento de cuota ──
    @Column(name = "recordatorio_activo", nullable = false)
    private Boolean recordatorioActivo = true;

    /** Cuántos días antes del vencimiento se avisa */
    @Column(name = "recordatorio_dias", nullable = false)
    private Integer recordatorioDias = 3;

    /** Además de la app, por mail (si el socio tiene mail y el servidor de mail está configurado) */
    @Column(name = "recordatorio_mail", nullable = false)
    private Boolean recordatorioMail = true;

    /** También avisar cuando la cuota ya venció (al día siguiente) */
    @Column(name = "recordatorio_vencida", nullable = false)
    private Boolean recordatorioVencida = true;
}
