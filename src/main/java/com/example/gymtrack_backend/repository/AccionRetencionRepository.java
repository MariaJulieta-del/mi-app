package com.example.gymtrack_backend.repository;

import com.example.gymtrack_backend.entities.AccionRetencion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AccionRetencionRepository extends JpaRepository<AccionRetencion, Long> {

    /** ¿Ya se hizo esta acción con el socio desde tal fecha? (para no repetir) */
    boolean existsBySocioIdAndTipoAndCreadaAfter(Long socioId, String tipo, LocalDateTime desde);

    @Query("select a from AccionRetencion a join fetch a.socio where a.estado = 'PENDIENTE' order by a.creada desc")
    List<AccionRetencion> pendientes();

    @Query("select a from AccionRetencion a join fetch a.socio where a.creada >= :desde order by a.creada desc")
    List<AccionRetencion> desde(@Param("desde") LocalDateTime desde);
}
