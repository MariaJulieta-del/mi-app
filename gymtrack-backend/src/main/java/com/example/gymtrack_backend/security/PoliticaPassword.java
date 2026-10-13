package com.example.gymtrack_backend.security;

/** Requisitos mínimos de contraseña para cuentas del staff */
public final class PoliticaPassword {

    public static final String MENSAJE =
            "La contraseña debe tener al menos 8 caracteres e incluir letras y números.";

    private PoliticaPassword() {}

    /** null si es válida; si no, el motivo */
    public static String validar(String password) {
        if (password == null || password.length() < 8) return MENSAJE;
        boolean letra = password.chars().anyMatch(Character::isLetter);
        boolean numero = password.chars().anyMatch(Character::isDigit);
        return (letra && numero) ? null : MENSAJE;
    }
}
