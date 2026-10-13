package com.example.gymtrack_backend.repository;

import com.example.gymtrack_backend.entities.BajaSocio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface BajaSocioRepository extends JpaRepository<BajaSocio, Long> {

    @Query("SELECT b FROM BajaSocio b LEFT JOIN FETCH b.socio ORDER BY b.fecha DESC")
    List<BajaSocio> findAllConSocio();
}
