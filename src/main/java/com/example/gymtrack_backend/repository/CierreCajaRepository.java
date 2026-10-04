package com.example.gymtrack_backend.repository;

import com.example.gymtrack_backend.entities.CierreCaja;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface CierreCajaRepository extends JpaRepository<CierreCaja, Long> {

    Optional<CierreCaja> findByFecha(LocalDate fecha);

    boolean existsByFecha(LocalDate fecha);

    List<CierreCaja> findAllByOrderByFechaDesc();
}
