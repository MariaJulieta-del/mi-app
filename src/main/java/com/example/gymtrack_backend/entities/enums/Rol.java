package com.example.gymtrack_backend.entities.enums;

public enum Rol {
    ADMIN,      // Acceso total al sistema
    PROFESOR,   // Gestión de socios, rutinas y disciplinas — sin reportes, pagos/membresías solo lectura
    SOCIO       // Solo ve su propio perfil, rutinas y membresía
}
