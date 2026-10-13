package com.example.gymtrack_backend.repository;

import com.example.gymtrack_backend.entities.Mantenimiento;
import com.example.gymtrack_backend.entities.enums.TipoMantenimiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MantenimientoRepository extends JpaRepository<Mantenimiento, Long> {

    long countByMaquinaId(Long maquinaId);

    /** Todos los mantenimientos de una máquina, ordenados del más reciente al más antiguo */
    List<Mantenimiento> findByMaquinaIdOrderByFechaMantenimientoDescFechaCreacionDesc(Long maquinaId);

    /** Todos los mantenimientos de un tipo específico */
    List<Mantenimiento> findByTipoOrderByFechaMantenimientoDescFechaCreacionDesc(TipoMantenimiento tipo);

    /** Todos, ordenados del más reciente al más antiguo */
    List<Mantenimiento> findAllByOrderByFechaMantenimientoDescFechaCreacionDesc();
}
