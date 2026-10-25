package com.example.gymtrack_backend.repository;

import com.example.gymtrack_backend.entities.Asistencia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface AsistenciaRepository extends JpaRepository<Asistencia, Long> {

    List<Asistencia> findBySocioIdOrderByFechaDescHoraDesc(Long socioId);

    /** Con el socio en la misma consulta: quien la usa siempre lee sus datos (evita una consulta extra) */
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = "socio")
    List<Asistencia> findByFechaOrderByHoraDesc(LocalDate fecha);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = "socio")
    List<Asistencia> findByFechaBetweenOrderByFechaDescHoraDesc(LocalDate desde, LocalDate hasta);

    @Query("SELECT COUNT(DISTINCT a.socio.id) FROM Asistencia a WHERE a.fecha = :fecha AND a.permitido = true")
    Long countSociosHoy(LocalDate fecha);

    boolean existsBySocioIdAndFechaAndTipo(Long socioId, LocalDate fecha, String tipo);

    /** ¿El socio ya ingresó (con acceso permitido) en esa fecha? Un mismo día consume un solo pase. */
    boolean existsBySocioIdAndFechaAndTipoAndPermitidoTrue(Long socioId, LocalDate fecha, String tipo);

    /** (socioId, fecha) de los días con ingreso permitido en un período, para todos los socios de una vez */
    @Query("SELECT DISTINCT a.socio.id, a.fecha FROM Asistencia a WHERE a.tipo = 'ENTRADA' AND a.permitido = true AND a.fecha BETWEEN :desde AND :hasta")
    List<Object[]> diasConIngresoEntre(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);

    /** (socioId, última fecha) de cada socio; soloPermitidas = solo ingresos aceptados */
    @Query("SELECT a.socio.id, MAX(a.fecha) FROM Asistencia a WHERE (:soloPermitidas = false OR a.permitido = true) GROUP BY a.socio.id")
    List<Object[]> ultimaVisitaPorSocio(@Param("soloPermitidas") boolean soloPermitidas);

    /** (socioId, hora) de los ingresos permitidos de un período (sin cargar las entidades) */
    @Query("SELECT a.socio.id, a.hora FROM Asistencia a WHERE a.tipo = 'ENTRADA' AND a.permitido = true AND a.fecha BETWEEN :desde AND :hasta")
    List<Object[]> horasDeIngresoEntre(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);

    /** Días distintos con ingreso permitido en un período → pases consumidos */
    @Query("SELECT COUNT(DISTINCT a.fecha) FROM Asistencia a WHERE a.socio.id = :socioId AND a.tipo = 'ENTRADA' AND a.permitido = true AND a.fecha BETWEEN :desde AND :hasta")
    long countDiasConIngreso(@Param("socioId") Long socioId, @Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);
}
