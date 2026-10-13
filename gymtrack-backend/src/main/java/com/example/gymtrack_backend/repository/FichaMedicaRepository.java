package com.example.gymtrack_backend.repository;

import com.example.gymtrack_backend.entities.FichaMedica;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface FichaMedicaRepository extends JpaRepository<FichaMedica, Long> {
    Optional<FichaMedica> findBySocioId(Long socioId);
}
