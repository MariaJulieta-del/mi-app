package com.example.gymtrack_backend.repository;

import com.example.gymtrack_backend.entities.TokenRevocado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

public interface TokenRevocadoRepository extends JpaRepository<TokenRevocado, String> {
    @Modifying
    @Transactional
    @Query("delete from TokenRevocado t where t.expira < :ahora")
    int borrarVencidos(@Param("ahora") LocalDateTime ahora);
}
