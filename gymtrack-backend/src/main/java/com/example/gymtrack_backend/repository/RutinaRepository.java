package com.example.gymtrack_backend.repository;

import com.example.gymtrack_backend.entities.Rutina;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

/**
 * Repository para acceder a la tabla rutinas.
 * Spring Data JPA genera la implementación automáticamente.
 */
@Repository
public interface RutinaRepository extends JpaRepository<Rutina, Long> {

    /**
     * Obtiene todas las rutinas que pertenecen a un socio.
     * Equivale a: SELECT * FROM rutinas WHERE socio_id = ?
     */
    List<Rutina> findBySocioId(Long socioId);

    /**
     * Busca una rutina por su ID y valida que pertenezca al socio indicado.
     * Útil para verificar propietario antes de editar o eliminar.
     * Equivale a: SELECT * FROM rutinas WHERE id = ? AND socio_id = ?
     */
    Optional<Rutina> findByIdAndSocioId(Long id, Long socioId);

    /**
     * Elimina todas las rutinas de un socio.
     * Útil para cleanup al dar de baja a un socio.
     */
    void deleteBySocioId(Long socioId);

    /** Rutinas generales sin socio asignado (templates del admin). */
    List<Rutina> findBySocioIsNull();
}
