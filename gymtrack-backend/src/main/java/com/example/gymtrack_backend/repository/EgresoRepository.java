package com.example.gymtrack_backend.repository;

import com.example.gymtrack_backend.entities.Egreso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface EgresoRepository extends JpaRepository<Egreso, Long> {

    List<Egreso> findByFechaOrderByCreatedAtDesc(LocalDate fecha);

    List<Egreso> findByFechaBetweenOrderByFechaDescCreatedAtDesc(LocalDate desde, LocalDate hasta);

    @Query("SELECT COALESCE(SUM(e.monto), 0) FROM Egreso e WHERE e.fecha = :fecha")
    BigDecimal sumMontoByFecha(@Param("fecha") LocalDate fecha);

    @Query("SELECT COALESCE(SUM(e.monto), 0) FROM Egreso e WHERE e.fecha BETWEEN :desde AND :hasta")
    BigDecimal sumMontoByFechaBetween(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);
}
