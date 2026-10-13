package com.example.gymtrack_backend.entities;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "notificaciones")
public class Notificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titulo;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String mensaje;

    /** AVISO / RECORDATORIO / VENCIMIENTO */
    @Column(nullable = false)
    private String tipo = "AVISO";

    /** TODOS / DISCIPLINA / SOCIO */
    @Column(nullable = false)
    private String destinatario = "TODOS";

    /** Si destinatario = SOCIO, apunta al socio específico */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "socio_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Socio socio;

    /** Si destinatario = DISCIPLINA, los alumnos inscriptos en esa disciplina */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "disciplina_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Disciplina disciplina;

    @Column(nullable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    @Column(nullable = false)
    private Boolean activa = true;

    /** Se mandó también por mail */
    @Column(name = "por_email", nullable = false)
    private Boolean porEmail = true;

    /** Se preparó para mandar por WhatsApp */
    @Column(name = "por_whatsapp", nullable = false)
    private Boolean porWhatsapp = false;
}
