package com.example.gymtrack_backend.service;

import com.example.gymtrack_backend.entities.Maquina;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class SugerenciaMaquinasTest {

    private static final List<Maquina> GIMNASIO = new ArrayList<>();
    static {
        String[] nombres = {
            "Sillón de cuádriceps", "Polea ", "Hip trust ", "Máquina Press de Pecho", "Pec Deck / Mariposa",
            "Máquina de Fondos Asistida", "Máquina de Jalón al Pecho (Lat Pulldown)", "Máquina de Remo Sentado (Cable Row)",
            "Máquina de Remo con Pecho (Chest Supported Row)", "Máquina de Dominadas Asistida", "Máquina Press de Hombros",
            "Máquina de Elevaciones Laterales", "Máquina de Curl de Bíceps (Predicador)", "Polea Alta para Curl",
            "Prensa de Piernas (Leg Press)", "Máquina de Extensión de Cuádriceps (Leg Extension)",
            "Máquina de Curl Femoral Acostado (Lying Leg Curl)", "Máquina de Curl Femoral Sentado (Seated Leg Curl)",
            "Banco de Pesas Regulable", "Rack de Sentadillas / Power Rack", "Remo Ergómetro",
        };
        long id = 1;
        for (String n : nombres) {
            Maquina m = new Maquina();
            m.setId(id++);
            m.setNombre(n);
            m.setActiva(true);
            GIMNASIO.add(m);
        }
    }

    private List<String> sugerir(String ejercicio) {
        return SugerenciaMaquinas.sugerir(ejercicio, GIMNASIO).stream().map(Maquina::getNombre).toList();
    }

    @Test
    void sugiereLaMaquinaConElMismoNombre() {
        assertEquals(List.of("Prensa de Piernas (Leg Press)"), sugerir("Prensa de piernas"));
        assertEquals(List.of("Pec Deck / Mariposa"), sugerir("Pec deck (máquina mariposa)"));
        assertEquals(List.of("Máquina de Jalón al Pecho (Lat Pulldown)"), sugerir("Jalón al pecho"));
        assertEquals(List.of("Máquina de Dominadas Asistida"), sugerir("Dominadas (pull-up)"));
        assertEquals(List.of("Máquina de Extensión de Cuádriceps (Leg Extension)"), sugerir("Extensión de cuádriceps"));
        assertEquals(List.of("Rack de Sentadillas / Power Rack"), sugerir("Sentadilla con barra"));
        assertEquals(List.of("Máquina de Elevaciones Laterales"), sugerir("Elevaciones laterales"));
    }

    @Test
    void conDosIgualDeBuenasMuestraAmbas() {
        assertEquals(2, sugerir("Curl femoral en máquina").size());
    }

    @Test
    void siEsAmbiguoNoSugiereNada() {
        assertTrue(sugerir("Remo en polea baja").isEmpty());      // "remo" y "polea" aparecen en varias
        assertTrue(sugerir("Curl martillo").isEmpty());
        assertTrue(sugerir("Plancha frontal").isEmpty());
        assertTrue(sugerir("Press militar con mancuernas").isEmpty());
    }

    @Test
    void ignoraMaquinasInactivas() {
        Maquina inactiva = new Maquina();
        inactiva.setId(99L);
        inactiva.setNombre("Máquina de Plancha Frontal");
        inactiva.setActiva(false);
        List<Maquina> lista = new ArrayList<>(GIMNASIO);
        lista.add(inactiva);
        assertTrue(SugerenciaMaquinas.sugerir("Plancha frontal", lista).isEmpty());
    }
}
