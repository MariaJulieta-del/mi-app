package com.example.gymtrack_backend.repository;

import com.example.gymtrack_backend.entities.ProgresoEjercicio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProgresoEjercicioRepository extends JpaRepository<ProgresoEjercicio, Long> {

    /** Historial de un ejercicio específico para un socio, ordenado por fecha desc */
    List<ProgresoEjercicio> findBySocioIdAndRutinaEjercicioIdOrderByFechaDesc(
            Long socioId, Long rutinaEjercicioId);

    /** Todo el progreso de un socio para una rutina completa */
    List<ProgresoEjercicio> findBySocioIdAndRutinaEjercicio_RutinaIdOrderByFechaDesc(
            Long socioId, Long rutinaId);

    /** Todo el progreso de un socio (todas sus rutinas), del más viejo al más nuevo */
    List<ProgresoEjercicio> findBySocioIdOrderByFechaAsc(Long socioId);

    /** Último registro de un ejercicio para un socio */
    Optional<ProgresoEjercicio> findTopBySocioIdAndRutinaEjercicioIdOrderByFechaDesc(
            Long socioId, Long rutinaEjercicioId);

    /** Registro de hoy de un ejercicio para un socio */
    Optional<ProgresoEjercicio> findBySocioIdAndRutinaEjercicioIdAndFecha(
            Long socioId, Long rutinaEjercicioId, LocalDate fecha);

    /** Elimina todo el progreso de una rutina completa (para borrado en cascada) */
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query(
        "DELETE FROM ProgresoEjercicio pe WHERE pe.rutinaEjercicio.rutina.id = :rutinaId")
    void deleteByRutinaId(@org.springframework.data.repository.query.Param("rutinaId") Long rutinaId);
}
