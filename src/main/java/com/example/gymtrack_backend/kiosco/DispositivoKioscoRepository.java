package com.example.gymtrack_backend.kiosco;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DispositivoKioscoRepository extends JpaRepository<DispositivoKiosco, Long> {

    List<DispositivoKiosco> findByActivoTrueOrderByCreadoDesc();
}
