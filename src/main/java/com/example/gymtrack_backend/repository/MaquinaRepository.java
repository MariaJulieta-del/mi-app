package com.example.gymtrack_backend.repository;

import com.example.gymtrack_backend.entities.Maquina;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MaquinaRepository extends JpaRepository<Maquina, Long> {

    /** Saca la máquina de los ejercicios que la usaban */
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query(value = "DELETE FROM ejercicio_maquinas_requeridas WHERE maquina_id = :id", nativeQuery = true)
    int quitarDeEjercicios(@org.springframework.data.repository.query.Param("id") Long id);
    List<Maquina> findByActivaTrue();
    boolean existsByNroMaquina(String nroMaquina);
}
