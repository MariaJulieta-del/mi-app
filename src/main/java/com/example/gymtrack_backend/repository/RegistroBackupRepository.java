package com.example.gymtrack_backend.repository;

import com.example.gymtrack_backend.entities.RegistroBackup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RegistroBackupRepository extends JpaRepository<RegistroBackup, Long> {

    List<RegistroBackup> findTop30ByOrderByFechaDesc();

    Optional<RegistroBackup> findFirstByEstadoOrderByFechaDesc(String estado);

    Optional<RegistroBackup> findFirstByOrderByFechaDesc();
}
