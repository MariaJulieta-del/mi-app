package com.example.gymtrack_backend.repository;

import com.example.gymtrack_backend.entities.ReservaClase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ReservaClaseRepository extends JpaRepository<ReservaClase, Long> {

    Optional<ReservaClase> findByDisciplinaIdAndSocioIdAndFechaAndHoraInicio(Long disciplinaId, Long socioId, LocalDate fecha, String horaInicio);

    /** Reservas de una clase puntual, en el orden en que se hicieron (para la lista de espera) */
    @Query("select r from ReservaClase r join fetch r.socio where r.disciplina.id = :disciplinaId and r.fecha = :fecha and r.horaInicio = :hora order by r.creada asc, r.id asc")
    List<ReservaClase> deLaClase(@Param("disciplinaId") Long disciplinaId, @Param("fecha") LocalDate fecha, @Param("hora") String hora);

    /** Reservas de varias clases en un rango de fechas */
    @Query("select r from ReservaClase r join fetch r.socio where r.fecha between :desde and :hasta")
    List<ReservaClase> entre(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);

    @Query("select r from ReservaClase r join fetch r.disciplina where r.socio.id = :socioId and r.fecha >= :desde order by r.fecha, r.horaInicio")
    List<ReservaClase> delSocioDesde(@Param("socioId") Long socioId, @Param("desde") LocalDate desde);

    /** Confirmadas de clases que ya pasaron (para marcar quién vino y quién no) */
    @Query("select r from ReservaClase r join fetch r.disciplina join fetch r.socio where r.estado = 'CONFIRMADA' and r.fecha <= :hasta")
    List<ReservaClase> confirmadasHasta(@Param("hasta") LocalDate hasta);

    /** Faltazos (reservó y no vino): se cuentan como pase usado */
    @Query("select count(r) from ReservaClase r where r.socio.id = :socioId and r.estado = 'AUSENTE' and r.fecha between :desde and :hasta")
    long contarAusentes(@Param("socioId") Long socioId, @Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);
}
