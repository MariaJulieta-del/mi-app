package com.example.gymtrack_backend.repository;

import com.example.gymtrack_backend.entities.RutinaAsignacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RutinaAsignacionRepository extends JpaRepository<RutinaAsignacion, Long> {

    /** Plantillas asignadas a un socio */
    @Query("select a from RutinaAsignacion a join fetch a.rutina where a.socio.id = :socioId")
    List<RutinaAsignacion> deSocio(Long socioId);

    /** Socios activos que tienen asignada una plantilla */
    @Query("select a from RutinaAsignacion a join fetch a.socio s where a.rutina.id = :rutinaId and s.activo = true order by a.fechaAsignacion desc")
    List<RutinaAsignacion> dePlantilla(Long rutinaId);

    /** Todas las asignaciones de socios activos (listado de plantillas y rutinas para renovar) */
    @Query("select a from RutinaAsignacion a join fetch a.socio s join fetch a.rutina where s.activo = true")
    List<RutinaAsignacion> deSociosActivos();

    /** Plantillas asignadas a varios socios en una sola consulta */
    @Query("select a from RutinaAsignacion a join fetch a.rutina where a.socio.id in :socioIds")
    List<RutinaAsignacion> deSocios(java.util.Collection<Long> socioIds);

    Optional<RutinaAsignacion> findByRutinaIdAndSocioId(Long rutinaId, Long socioId);

    boolean existsByRutinaIdAndSocioId(Long rutinaId, Long socioId);

    long countByRutinaId(Long rutinaId);
}
