package com.example.gymtrack_backend.repository;

import com.example.gymtrack_backend.entities.Socio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SocioRepository extends JpaRepository<Socio, Long> {
    List<Socio> findByActivoTrue();

    /** Bloquea la fila del socio hasta el fin de la transacción (cobros simultáneos al mismo socio) */
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from Socio s where s.id = :id")
    Optional<Socio> bloquear(@Param("id") Long id);
    boolean existsByDni(String dni);
    Optional<Socio> findByDni(String dni);
    long countByActivoTrue();



    /** Socios activos que NO tienen ninguna asistencia ENTRADA permitida desde :desde */
    @Query("""
        SELECT s FROM Socio s
        WHERE s.activo = true
        AND s.id NOT IN (
            SELECT DISTINCT a.socio.id FROM Asistencia a
            WHERE a.fecha >= :desde AND a.tipo = 'ENTRADA' AND a.permitido = true
        )
        ORDER BY s.apellido, s.nombre
        """)
    List<Socio> findActivosSinAsistenciaDesde(@Param("desde") LocalDate desde);

    /** Los números del tablero de inicio en una sola consulta: socios activos, cuántos de ellos están al día y con la cuota vencida,
     *  recaudado en el período y socios que ingresaron en el día */
    @Query(value = """
        SELECT (SELECT count(*) FROM socios WHERE activo = true),
               (SELECT count(*) FROM membresias m JOIN socios s ON s.id = m.socio_id WHERE s.activo = true AND m.estado_membresia = 'ACTIVA'),
               (SELECT count(*) FROM membresias m JOIN socios s ON s.id = m.socio_id WHERE s.activo = true AND m.estado_membresia = 'VENCIDA'),
               (SELECT coalesce(sum(monto), 0) FROM pagos WHERE estado_pago = 'COMPLETADO' AND fecha_pago >= :desde AND fecha_pago < :hasta),
               (SELECT count(DISTINCT socio_id) FROM asistencias WHERE fecha = :hoy AND permitido = true)
        """, nativeQuery = true)
    List<Object[]> resumenDashboard(@Param("desde") java.time.LocalDateTime desde, @Param("hasta") java.time.LocalDateTime hasta,
                                    @Param("hoy") LocalDate hoy);
}
