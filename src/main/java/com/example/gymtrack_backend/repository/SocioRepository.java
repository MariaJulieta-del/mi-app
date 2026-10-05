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
}