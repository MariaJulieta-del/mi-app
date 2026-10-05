package com.example.gymtrack_backend.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/** Un socio inscripto en una disciplina (puede estar en varias) */
@Entity
@Table(name = "disciplina_inscripciones",
       uniqueConstraints = @UniqueConstraint(name = "ux_disciplina_inscripciones", columnNames = {"disciplina_id", "socio_id"}))
@Getter @Setter @NoArgsConstructor
public class InscripcionDisciplina {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "disciplina_id")
    private Disciplina disciplina;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "socio_id")
    private Socio socio;

    @Column(name = "fecha_alta", nullable = false)
    private LocalDate fechaAlta = LocalDate.now();
}
