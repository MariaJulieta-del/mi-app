package com.example.gymtrack_backend.repository;

import com.example.gymtrack_backend.entities.TarifaMembresia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TarifaMembresiaRepository extends JpaRepository<TarifaMembresia, String> {
}
