package com.example.gymtrack_backend.repository;

import com.example.gymtrack_backend.entities.Membresia;
import com.example.gymtrack_backend.entities.enums.EstadoMembresia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MembresiaRepository extends JpaRepository<Membresia, Long> {

    /** La membresía del socio (cada socio tiene una sola) */
    Optional<Membresia> findBySocioId(Long socioId);

    /** Membresías de un socio filtradas por estado */
    List<Membresia> findBySocioIdAndEstadoMembresia(Long socioId, EstadoMembresia estado);

    /** Todas las membresías de un estado específico (ej: listar todas las ACTIVAS) */
    List<Membresia> findByEstadoMembresia(EstadoMembresia estado);

    /** Membresías ACTIVAS que vencen entre dos fechas (para alerta de próximos a vencer) */
    List<Membresia> findByEstadoMembresiaAndFechaVencimientoBetween(
            EstadoMembresia estado, LocalDate desde, LocalDate hasta);

    /** Membresías en cualquiera de los estados dados (para morosos) */
    List<Membresia> findByEstadoMembresiaIn(List<EstadoMembresia> estados);

    /** Cuenta socios activos para un tipo de plan */
    @Query("SELECT COUNT(m) FROM Membresia m WHERE m.tipoMembresia = :tipo AND m.estadoMembresia = 'ACTIVA'")
    long countActivosByTipo(@Param("tipo") String tipo);

    /** Verifica si un socio ya tiene una membresía activa */
    boolean existsBySocioIdAndEstadoMembresia(Long socioId, EstadoMembresia estado);

    /**
     * Marca como VENCIDAS todas las membresías ACTIVAS cuya fechaVencimiento
     * ya pasó. Se puede llamar desde un @Scheduled diario.
     */
    @Modifying
    @Query("""
        UPDATE Membresia m
        SET m.estadoMembresia = 'VENCIDA'
        WHERE m.estadoMembresia = 'ACTIVA'
          AND m.fechaVencimiento < :hoy
        """)
    int vencerMembresiasExpiradas(@Param("hoy") LocalDate hoy);
}
