package com.example.gymtrack_backend.entities;

import jakarta.persistence.*;
import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "maquinas")
public class Maquina {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Número identificatorio físico de la máquina, ej: "M-01".
     * Opcional: barras, mancuernas y accesorios genéricos no tienen número fijo.
     */
    @Column(name = "nro_maquina", nullable = true, unique = true, length = 20)
    private String nroMaquina;

    @Column(nullable = false)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    /**
     * Grupos musculares que trabaja esta máquina.
     * Usa la misma lista que Ejercicio para poder cruzar relaciones.
     */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "maquina_grupos", joinColumns = @JoinColumn(name = "maquina_id"))
    @Column(name = "grupo")
    private List<String> grupos = new ArrayList<>();

    /** Instrucciones de uso (cómo se usa correctamente) */
    @Column(name = "instrucciones_uso", columnDefinition = "TEXT")
    private String instruccionesUso;

    /** Tips de ajuste de la máquina (asiento, agarre, recorrido) */
    @Column(columnDefinition = "TEXT")
    private String ajustes;

    @Column(nullable = false)
    private Boolean activa = true;
}
