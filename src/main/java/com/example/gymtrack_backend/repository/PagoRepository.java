package com.example.gymtrack_backend.repository;

import com.example.gymtrack_backend.entities.Pago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PagoRepository extends JpaRepository<Pago, Long> {

    java.util.Optional<Pago> findByClaveIdempotencia(String clave);

    /** Pagos de un período con membresía y socio (una sola consulta) */
    @Query("select p from Pago p join fetch p.membresia m join fetch m.socio where p.fechaPago >= :desde and p.fechaPago < :hasta order by p.fechaPago desc")
    List<Pago> entreConSocio(@Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta);

    /** (fecha, monto, socioId) de los pagos completados desde una fecha, sin cargar entidades */
    @Query("select p.fechaPago, p.monto, m.socio.id from Pago p join p.membresia m where p.estadoPago = 'COMPLETADO' and p.fechaPago >= :desde")
    List<Object[]> completadosDesde(@Param("desde") LocalDateTime desde);

    /** (socioId, primer pago) de cada socio */
    @Query("select m.socio.id, min(p.fechaPago) from Pago p join p.membresia m where p.estadoPago = 'COMPLETADO' group by m.socio.id")
    List<Object[]> primerPagoPorSocio();

    /** Total cobrado (completados) en un período */
    @Query("select coalesce(sum(p.monto), 0) from Pago p where p.estadoPago = 'COMPLETADO' and p.fechaPago >= :desde and p.fechaPago < :hasta")
    BigDecimal totalCompletadoEntre(@Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta);

    /** (año, mes, total) de los pagos completados desde una fecha */
    @Query("select year(p.fechaPago), month(p.fechaPago), sum(p.monto) from Pago p where p.estadoPago = 'COMPLETADO' and p.fechaPago >= :desde group by year(p.fechaPago), month(p.fechaPago)")
    List<Object[]> totalesPorMes(@Param("desde") LocalDateTime desde);

    /** Pagos completados de un socio desde un momento (para frenar el doble cobro sin clave) */
    @Query("select p from Pago p where p.membresia.socio.id = :socioId and p.estadoPago = 'COMPLETADO' and p.fechaPago >= :desde order by p.fechaPago desc")
    List<Pago> recientesDelSocio(@Param("socioId") Long socioId, @Param("desde") LocalDateTime desde);

    /** Historial de pagos de una membresía, ordenado por más reciente */
    List<Pago> findByMembresiaIdOrderByFechaPagoDesc(Long membresiaId);

    /** Todos los pagos de un socio (a través de sus membresías) */
    @Query("""
        SELECT p FROM Pago p
        WHERE p.membresia.socio.id = :socioId
        ORDER BY p.fechaPago DESC
        """)
    List<Pago> findBySocioId(@Param("socioId") Long socioId);

    /** Suma total de pagos COMPLETADOS de una membresía */
    @Query("""
        SELECT COALESCE(SUM(p.monto), 0)
        FROM Pago p
        WHERE p.membresia.id = :membresiaId
          AND p.estadoPago = 'COMPLETADO'
        """)
    BigDecimal sumMontoCompletoByMembresiaId(@Param("membresiaId") Long membresiaId);

    /** Suma pagos COMPLETADOS por método entre dos fechas (para cierre de caja) */
    @Query("""
        SELECT COALESCE(SUM(p.monto), 0)
        FROM Pago p
        WHERE p.estadoPago = 'COMPLETADO'
          AND p.metodoPago = :metodo
          AND p.fechaPago >= :desde
          AND p.fechaPago < :hasta
        """)
    BigDecimal sumByMetodoAndFecha(
        @Param("metodo") com.example.gymtrack_backend.entities.enums.MetodoPago metodo,
        @Param("desde") LocalDateTime desde,
        @Param("hasta") LocalDateTime hasta);

    /** Cuenta pagos COMPLETADOS entre dos fechas */
    @Query("""
        SELECT COUNT(p)
        FROM Pago p
        WHERE p.estadoPago = 'COMPLETADO'
          AND p.fechaPago >= :desde
          AND p.fechaPago < :hasta
        """)
    long countCompletadosByFecha(@Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta);
}
