package com.example.gymtrack_backend.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "disciplinas")
public class Disciplina {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    /** Nombre del instructor cuando no es un profesor cargado en la app */
    private String instructor;

    /** Profesor a cargo (opcional). Si está, su nombre reemplaza al texto de "instructor" */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profesor_id")
    @JsonIgnore
    private Usuario profesor;

    private Integer cupoMaximo;

    @Column(nullable = false)
    private Boolean activa = true;

    /** Color de la paleta de la app (1 a 8) para el calendario */
    private Integer color;

    /** Horarios de la semana: un renglón por día y franja */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "disciplina_horarios", joinColumns = @JoinColumn(name = "disciplina_id"))
    private List<Horario> horarios = new ArrayList<>();

    @Embeddable
    @Data
    public static class Horario {
        /** LUNES, MARTES, MIÉRCOLES, JUEVES, VIERNES, SÁBADO, DOMINGO */
        @Column(name = "dia", nullable = false, length = 10)
        private String dia;
        /** "HH:mm" */
        @Column(name = "hora_inicio", nullable = false, length = 5)
        private String horaInicio;
        @Column(name = "hora_fin", nullable = false, length = 5)
        private String horaFin;
    }
}
