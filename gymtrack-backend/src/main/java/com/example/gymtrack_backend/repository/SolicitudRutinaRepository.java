package com.example.gymtrack_backend.repository;

import com.example.gymtrack_backend.entities.SolicitudRutina;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SolicitudRutinaRepository extends JpaRepository<SolicitudRutina, Long> {

    @Query("select s from SolicitudRutina s where s.socio.id = :socioId and s.estado in ('PENDIENTE', 'EN_CURSO')")
    Optional<SolicitudRutina> abiertaDe(@Param("socioId") Long socioId);

    Optional<SolicitudRutina> findFirstBySocioIdOrderByCreadaDesc(Long socioId);

    @Query("select s from SolicitudRutina s join fetch s.socio where s.estado in ('PENDIENTE', 'EN_CURSO') order by s.creada")
    List<SolicitudRutina> abiertas();

    @Query("select s from SolicitudRutina s join fetch s.socio where s.estado not in ('PENDIENTE', 'EN_CURSO') and s.resuelta >= :desde order by s.resuelta desc")
    List<SolicitudRutina> resueltasDesde(@Param("desde") LocalDateTime desde);

    @Query("select count(s) from SolicitudRutina s where s.estado in ('PENDIENTE', 'EN_CURSO')")
    long contarAbiertas();

    @Query("select count(s) from SolicitudRutina s where s.socio.id = :socioId and s.creada >= :desde")
    long contarDesde(@Param("socioId") Long socioId, @Param("desde") LocalDateTime desde);
}
