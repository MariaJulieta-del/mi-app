package com.example.gymtrack_backend.service;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.TreeSet;

import static org.junit.jupiter.api.Assertions.*;

class RetencionYLogrosTest {

    private static final LocalDate HOY = LocalDate.of(2026, 10, 8);   // jueves

    private static TreeSet<LocalDate> dias(int... haceDias) {
        TreeSet<LocalDate> s = new TreeSet<>();
        for (int d : haceDias) s.add(HOY.minusDays(d));
        return s;
    }

    @Test
    void rachaSemanalNoSeCortaPorLaSemanaEnCurso() {
        // Vino las 3 semanas anteriores y esta semana todavía no
        int[] r = GamificacionService.rachas(dias(7, 14, 21), HOY);
        assertEquals(3, r[0]);
        assertEquals(3, r[1]);
    }

    @Test
    void rachaSeCortaSiFaltaUnaSemana() {
        // Esta semana y la anterior, pero hace 3 semanas no
        int[] r = GamificacionService.rachas(dias(0, 7, 28, 35, 42), HOY);
        assertEquals(2, r[0]);
        assertEquals(3, r[1], "la mejor racha fueron las 3 semanas de antes");
    }

    @Test
    void sinDiasNoHayRacha() {
        assertArrayEquals(new int[]{0, 0}, GamificacionService.rachas(new TreeSet<>(), HOY));
    }

    @Test
    void frecuenciaHabitualEsElPromedioEntreVisitas() {
        assertEquals(3.0, RetencionService.frecuenciaHabitual(dias(3, 6, 9, 12), HOY), 0.01);
        // Con pocas visitas recientes se asume una por semana
        assertEquals(7.0, RetencionService.frecuenciaHabitual(dias(90), HOY), 0.01);
        // Nunca menos de 2 días (aunque venga todos los días)
        assertEquals(2.0, RetencionService.frecuenciaHabitual(dias(1, 2, 3, 4), HOY), 0.01);
    }

    @Test
    void elMensajeDeRecuperoDependeDelMotivo() {
        assertTrue(RetencionService.mensajeRecupero("Ana", "PRECIO", 30).contains("planes"));
        assertTrue(RetencionService.mensajeRecupero("Ana", "HORARIOS", 30).contains("horarios"));
        assertTrue(RetencionService.mensajeRecupero("Ana", null, 30).startsWith("¡Hola Ana!"));
        assertTrue(RetencionService.mensajeRecupero("Ana", "PRECIO", 60).contains("primera semana"), "desde los 60 días se ofrece algo");
        assertFalse(RetencionService.mensajeRecupero("Ana", "PRECIO", 30).contains("primera semana"));
    }

    @Test
    void laVentanaDeAsistenciaNoCruzaLaMedianoche() {
        assertEquals(java.time.LocalTime.of(17, 30), DisciplinaService.desdeAntes(java.time.LocalTime.of(19, 0)));
        // Una clase a las 00:30: desde las 00:00, no desde las 23:00 del día anterior
        assertEquals(java.time.LocalTime.MIN, DisciplinaService.desdeAntes(java.time.LocalTime.of(0, 30)));
    }
}
