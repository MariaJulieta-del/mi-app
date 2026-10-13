package com.example.gymtrack_backend.repository;

import com.example.gymtrack_backend.entities.Ejercicio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EjercicioRepository extends JpaRepository<Ejercicio, Long> {
    List<Ejercicio> findByActivoTrue();
    List<Ejercicio> findByActivoTrueAndGruposContaining(String grupo);
}
