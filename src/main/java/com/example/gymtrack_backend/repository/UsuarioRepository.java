package com.example.gymtrack_backend.repository;

import com.example.gymtrack_backend.entities.Usuario;
import com.example.gymtrack_backend.entities.enums.Rol;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByUsername(String username);
    boolean existsByUsername(String username);
    Optional<Usuario> findBySocioId(Long socioId);
    List<Usuario> findByRol(Rol rol);

    /** ID del socio vinculado al usuario (null si es staff) — sin cargar la entidad completa */
    @Query("select s.id from Usuario u join u.socio s where u.username = :username")
    Optional<Long> findSocioIdByUsername(@Param("username") String username);

    /** false si el socio vinculado fue dado de baja */
    @Query("select s.activo from Usuario u join u.socio s where u.username = :username")
    Optional<Boolean> findSocioActivoByUsername(@Param("username") String username);
}
