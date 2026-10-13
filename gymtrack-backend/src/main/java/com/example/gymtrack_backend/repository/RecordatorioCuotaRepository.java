package com.example.gymtrack_backend.repository;

import com.example.gymtrack_backend.entities.RecordatorioCuota;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface RecordatorioCuotaRepository extends JpaRepository<RecordatorioCuota, Long> {

    boolean existsBySocioIdAndFechaVencimientoAndTipo(Long socioId, LocalDate fechaVencimiento, String tipo);

    @Query("select r from RecordatorioCuota r join fetch r.socio where r.enviado >= :desde order by r.enviado desc")
    List<RecordatorioCuota> desde(@Param("desde") LocalDateTime desde);

    List<RecordatorioCuota> findBySocioIdOrderByEnviadoDesc(Long socioId);
}
