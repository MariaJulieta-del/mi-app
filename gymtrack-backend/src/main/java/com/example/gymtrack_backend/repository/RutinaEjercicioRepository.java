package com.example.gymtrack_backend.repository;

import com.example.gymtrack_backend.entities.RutinaEjercicio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * Repository para los ejercicios asociados a una rutina.
 */
@Repository
public interface RutinaEjercicioRepository extends JpaRepository<RutinaEjercicio, Long> {

    /**
     * Obtiene todos los ejercicios de una rutina, ordenados por su campo 'orden'.
     */
    List<RutinaEjercicio> findByRutinaIdOrderByOrden(Long rutinaId);

    /**
     * Elimina todos los ejercicios de una rutina.
     * Útil al reemplazar la lista completa al editar una rutina.
     */
    @Modifying
    @Query("DELETE FROM RutinaEjercicio re WHERE re.rutina.id = :rutinaId")
    void deleteByRutinaId(@Param("rutinaId") Long rutinaId);

    /**
     * Cuenta cuántos ejercicios tiene una rutina.
     */
    int countByRutinaId(Long rutinaId);

    /** IDs de ejercicios del catálogo que usa alguna rutina */
    @Query("select distinct re.ejercicioCatalogo.id from RutinaEjercicio re where re.ejercicioCatalogo is not null")
    java.util.Set<Long> idsDeEjerciciosEnUso();
}
