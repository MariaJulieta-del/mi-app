package com.example.gymtrack_backend.repository;

import com.example.gymtrack_backend.entities.SesionEntrenamiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface SesionEntrenamientoRepository extends JpaRepository<SesionEntrenamiento, Long> {

    List<SesionEntrenamiento> findBySocioIdOrderByFechaDescCreadaDesc(Long socioId);

    @Query("select s from SesionEntrenamiento s join fetch s.socio where s.fecha >= :desde order by s.creada desc")
    List<SesionEntrenamiento> recientes(@Param("desde") LocalDate desde);

    @Query("select s from SesionEntrenamiento s join fetch s.socio where s.fecha between :desde and :hasta")
    List<SesionEntrenamiento> entre(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);
}
