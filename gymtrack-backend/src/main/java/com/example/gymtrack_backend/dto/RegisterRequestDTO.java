package com.example.gymtrack_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequestDTO {

    @NotBlank(message = "El username es obligatorio")
    @Size(min = 3, max = 50)
    private String username;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
    private String password;

    private String email;

    // ADMIN, EMPLEADO o SOCIO (por defecto EMPLEADO si no se especifica)
    private String rol;

    // Si rol=SOCIO, vincular a un socio existente
    private Long socioId;
}
