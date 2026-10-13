package com.example.gymtrack_backend.entities;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

/** Token de una sesión cerrada: no vale aunque no haya vencido */
@Data
@Entity
@Table(name = "tokens_revocados")
public class TokenRevocado {
    @Id
    @Column(length = 64)
    private String jti;

    @Column(nullable = false)
    private LocalDateTime expira;
}
