package com.example.gymtrack_backend.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class EjercicioLimpiezaServiceTest {

    private static boolean dup(String a, String b) {
        return EjercicioLimpiezaService.parecidos(EjercicioLimpiezaService.clave(a), EjercicioLimpiezaService.clave(b));
    }

    @Test
    void detectaDuplicadosReales() {
        assertTrue(dup("Hip trust ", "Hip thrust"));
        assertTrue(dup("Prensa Piernas ", "Prensa de piernas"));
        assertTrue(dup("dominadas", "Dominadas (pull-up)"));
        assertTrue(dup("Crunch", "crunch"));
    }

    @Test
    void noConfundeEjerciciosDistintos() {
        assertFalse(dup("dumbbell romanian deadlift", "barbell romanian deadlift"));
        assertFalse(dup("dumbbell single leg deadlift", "barbell single leg deadlift"));
        assertFalse(dup("Curl femoral acostado", "Curl femoral de pie"));
        assertFalse(dup("Elevación de talones de pie", "Elevación de talones sentado"));
        assertFalse(dup("Press de banca plano", "Press de banca inclinado"));
        assertFalse(dup("Curl", "Crunch"));
    }
}
