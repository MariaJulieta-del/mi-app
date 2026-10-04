package com.example.gymtrack_backend.kiosco;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Pantalla fija de recepción (tablet o monitor) vinculada por el admin.
 * Su token solo permite mostrar el QR de ingreso y los últimos ingresos.
 */
@Entity
@Table(name = "dispositivos_kiosco")
@Getter @Setter @NoArgsConstructor
public class DispositivoKiosco {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 60)
    private String nombre;

    @Column(nullable = false)
    private LocalDateTime creado;

    @Column(length = 50)
    private String creadoPor;

    /** false = desvinculada: su token deja de funcionar */
    @Column(nullable = false)
    private boolean activo = true;

    private LocalDateTime ultimoUso;
}
