package com.example.gymtrack_backend.repository;

import com.example.gymtrack_backend.entities.InscripcionDisciplina;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InscripcionDisciplinaRepository extends JpaRepository<InscripcionDisciplina, Long> {

    @Query("select i from InscripcionDisciplina i join fetch i.socio s where i.disciplina.id = :disciplinaId order by s.apellido, s.nombre")
    List<InscripcionDisciplina> findConSocioByDisciplinaId(@Param("disciplinaId") Long disciplinaId);

    @Query("select i from InscripcionDisciplina i join fetch i.disciplina where i.socio.id = :socioId")
    List<InscripcionDisciplina> findConDisciplinaBySocioId(@Param("socioId") Long socioId);

    /** Inscriptos de varias disciplinas en una sola consulta */
    @Query("select i from InscripcionDisciplina i join fetch i.socio s where i.disciplina.id in :ids order by s.apellido, s.nombre")
    List<InscripcionDisciplina> findConSocioByDisciplinaIdIn(@Param("ids") java.util.Collection<Long> ids);

    /** Cupos ocupados de varias disciplinas: [disciplinaId, cantidad] (solo socios activos) */
    @Query("select i.disciplina.id, count(i) from InscripcionDisciplina i where i.disciplina.id in :ids and i.socio.activo = true group by i.disciplina.id")
    List<Object[]> contarActivosPorDisciplina(@Param("ids") java.util.Collection<Long> ids);

    /** Cupos ocupados: solo cuentan los socios activos */
    @Query("select count(i) from InscripcionDisciplina i where i.disciplina.id = :disciplinaId and i.socio.activo = true")
    long contarActivos(@Param("disciplinaId") Long disciplinaId);

    Optional<InscripcionDisciplina> findByDisciplinaIdAndSocioId(Long disciplinaId, Long socioId);

    boolean existsByDisciplinaIdAndSocioId(Long disciplinaId, Long socioId);
}
