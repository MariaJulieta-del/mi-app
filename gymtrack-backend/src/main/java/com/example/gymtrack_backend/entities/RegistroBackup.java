package com.example.gymtrack_backend.entities;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/** Una copia de seguridad (hecha o fallida) */
@Data
@Entity
@Table(name = "backups")
public class RegistroBackup {

    public static final String OK = "OK";
    public static final String ERROR = "ERROR";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @Column(length = 200)
    private String archivo;

    /** LOCAL o SUPABASE */
    @Column(nullable = false, length = 20)
    private String destino;

    private Long tamano;
    private Integer tablas;
    private Long filas;

    @Column(name = "duracion_ms")
    private Long duracionMs;

    @Column(nullable = false, length = 10)
    private String estado;

    @Column(length = 500)
    private String error;

    @Column(nullable = false)
    private Boolean manual = false;
}
