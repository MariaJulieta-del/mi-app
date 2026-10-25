package com.example.gymtrack_backend.repository;

import com.example.gymtrack_backend.entities.CierreCaja;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface CierreCajaRepository extends JpaRepository<CierreCaja, Long> {

    Optional<CierreCaja> findByFecha(LocalDate fecha);

    boolean existsByFecha(LocalDate fecha);

    /** El último cierre antes de esa fecha (de ahí sale el fondo inicial) */
    Optional<CierreCaja> findFirstByFechaBeforeOrderByFechaDesc(LocalDate fecha);

    List<CierreCaja> findAllByOrderByFechaDesc();

    /** Fechas ya cerradas de un período (una sola consulta) */
    @org.springframework.data.jpa.repository.Query("SELECT c.fecha FROM CierreCaja c WHERE c.fecha BETWEEN :desde AND :hasta")
    List<LocalDate> fechasCerradas(@org.springframework.data.repository.query.Param("desde") LocalDate desde,
                                   @org.springframework.data.repository.query.Param("hasta") LocalDate hasta);
}
