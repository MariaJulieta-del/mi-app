package com.example.gymtrack_backend.repository;

import com.example.gymtrack_backend.entities.Asistencia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface AsistenciaRepository extends JpaRepository<Asistencia, Long> {

    List<Asistencia> findBySocioIdOrderByFechaDescHoraDesc(Long socioId);

    List<Asistencia> findByFechaOrderByHoraDesc(LocalDate fecha);

    List<Asistencia> findByFechaBetweenOrderByFechaDescHoraDesc(LocalDate desde, LocalDate hasta);

    @Query("SELECT COUNT(DISTINCT a.socio.id) FROM Asistencia a WHERE a.fecha = :fecha AND a.permitido = true")
    Long countSociosHoy(LocalDate fecha);

    boolean existsBySocioIdAndFechaAndTipo(Long socioId, LocalDate fecha, String tipo);

    /** ¿El socio ya ingresó (con acceso permitido) en esa fecha? Un mismo día consume un solo pase. */
    boolean existsBySocioIdAndFechaAndTipoAndPermitidoTrue(Long socioId, LocalDate fecha, String tipo);

    /** Días distintos con ingreso permitido en un período → pases consumidos */
    @Query("SELECT COUNT(DISTINCT a.fecha) FROM Asistencia a WHERE a.socio.id = :socioId AND a.tipo = 'ENTRADA' AND a.permitido = true AND a.fecha BETWEEN :desde AND :hasta")
    long countDiasConIngreso(@Param("socioId") Long socioId, @Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);
}
