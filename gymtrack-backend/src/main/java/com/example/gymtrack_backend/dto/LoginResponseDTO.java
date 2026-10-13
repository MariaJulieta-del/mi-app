package com.example.gymtrack_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponseDTO {
    private String token;
    private String username;
    private String rol;
    private Long   socioId; // null si no es un SOCIO vinculado
}
