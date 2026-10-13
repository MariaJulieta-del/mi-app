package com.example.gymtrack_backend.service;

import com.example.gymtrack_backend.entities.Maquina;

import java.text.Normalizer;
import java.util.*;

/**
 * Cuando un ejercicio no tiene máquina asociada, busca la del gimnasio cuyo nombre coincide
 * ("Prensa de piernas" → "Prensa de Piernas (Leg Press)"). Solo sugiere si la coincidencia es clara:
 * una sola máquina con más palabras en común, o hasta dos empatadas con 2 palabras o más.
 */
final class SugerenciaMaquinas {

    private static final Set<String> VACIAS = Set.of(
            "de", "del", "la", "las", "el", "los", "en", "con", "al", "a", "y", "o", "para", "por",
            "maquina", "maquinas", "machine", "the", "of");

    private SugerenciaMaquinas() {}

    static List<Maquina> sugerir(String nombreEjercicio, Collection<Maquina> maquinas) {
        Set<String> palabras = palabras(nombreEjercicio);
        if (palabras.isEmpty()) return List.of();
        int mejor = 0;
        List<Maquina> empatadas = new ArrayList<>();
        for (Maquina m : maquinas) {
            if (!Boolean.TRUE.equals(m.getActiva())) continue;
            Set<String> comunes = palabras(m.getNombre());
            comunes.retainAll(palabras);
            int puntaje = comunes.size();
            if (puntaje == 0 || puntaje < mejor) continue;
            if (puntaje > mejor) { mejor = puntaje; empatadas.clear(); }
            empatadas.add(m);
        }
        if (empatadas.size() == 1 || (mejor >= 2 && empatadas.size() == 2)) return empatadas;
        return List.of();
    }

    /** Palabras significativas, sin acentos y en singular simple ("sentadillas" → "sentadilla") */
    private static Set<String> palabras(String texto) {
        Set<String> out = new HashSet<>();
        if (texto == null) return out;
        String limpio = Normalizer.normalize(texto, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT);
        for (String p : limpio.split("[^a-z0-9]+")) {
            if (p.length() < 3 || VACIAS.contains(p)) continue;
            out.add(p.length() > 4 && p.endsWith("s") ? p.substring(0, p.length() - 1) : p);
        }
        return out;
    }
}
