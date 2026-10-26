package com.example.gymtrack_backend.auditoria;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface AuditoriaRepository extends JpaRepository<Auditoria, Long> {

    /** Los últimos movimientos, sin importar la fecha (lo que se ve al abrir Auditoría) */
    List<Auditoria> findByOrderByFechaDesc(Pageable pagina);

    List<Auditoria> findByFechaBetweenOrderByFechaDesc(LocalDateTime desde, LocalDateTime hasta, Pageable pageable);

    List<Auditoria> findBySocioIdOrderByFechaDesc(Long socioId, Pageable pageable);
}
