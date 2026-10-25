package com.example.gymtrack_backend.repository;

import com.example.gymtrack_backend.entities.Disciplina;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DisciplinaRepository extends JpaRepository<Disciplina, Long> {

    /** Para reservar o cancelar: dos personas no pueden tomar el último lugar a la vez */
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select d from Disciplina d where d.id = :id")
    java.util.Optional<Disciplina> bloquear(@org.springframework.data.repository.query.Param("id") Long id);
    /** Con el profesor a cargo en la misma consulta (se muestra su nombre) */
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = "profesor")
    List<Disciplina> findByActivaTrue();
}
