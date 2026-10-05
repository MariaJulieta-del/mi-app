package com.example.gymtrack_backend.service;

import com.example.gymtrack_backend.entities.Ejercicio;
import com.example.gymtrack_backend.repository.EjercicioRepository;
import com.example.gymtrack_backend.repository.RutinaEjercicioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.*;

/**
 * Limpieza del catálogo de ejercicios propio.
 * Solo se borran ejercicios DESACTIVADOS que ninguna rutina usa: así ninguna rutina pierde datos.
 */
@Service
@RequiredArgsConstructor
public class EjercicioLimpiezaService {

    /** Palabras que no cuentan al comparar nombres ("Prensa de piernas" ≈ "Prensa piernas") */
    private static final Set<String> VACIAS = Set.of("de", "del", "la", "el", "los", "las", "con", "en", "a", "y");

    private final EjercicioRepository ejercicioRepo;
    private final RutinaEjercicioRepository rutinaEjercicioRepo;

    public record Item(Long id, String nombre, boolean activo, boolean esMaquina) {}
    public record Vista(List<Item> borrables, List<Item> desactivadosEnUso, List<List<Item>> posiblesDuplicados, int total) {}

    @Transactional(readOnly = true)
    public Vista vistaPrevia() {
        List<Ejercicio> todos = ejercicioRepo.findAll();
        Set<Long> enUso = rutinaEjercicioRepo.idsDeEjerciciosEnUso();
        Comparator<Item> porNombre = Comparator.comparing(i -> i.nombre().toLowerCase());

        List<Item> borrables = todos.stream()
                .filter(e -> !Boolean.TRUE.equals(e.getActivo()) && !enUso.contains(e.getId()))
                .map(EjercicioLimpiezaService::item).sorted(porNombre).toList();
        List<Item> desactivadosEnUso = todos.stream()
                .filter(e -> !Boolean.TRUE.equals(e.getActivo()) && enUso.contains(e.getId()))
                .map(EjercicioLimpiezaService::item).sorted(porNombre).toList();

        return new Vista(borrables, desactivadosEnUso, duplicados(todos), todos.size());
    }

    /** Borra los desactivados que ninguna rutina usa. Devuelve cuántos. */
    @Transactional
    public int borrarViejos() {
        List<Item> borrables = vistaPrevia().borrables();
        borrables.forEach(i -> ejercicioRepo.deleteById(i.id()));
        com.example.gymtrack_backend.auditoria.AuditoriaInterceptor.detalle(borrables.size() + " ejercicios borrados");
        return borrables.size();
    }

    @Transactional
    public void borrar(Long id) {
        Ejercicio e = ejercicioRepo.findById(id).orElseThrow(() -> new IllegalArgumentException("Ejercicio no encontrado"));
        if (rutinaEjercicioRepo.idsDeEjerciciosEnUso().contains(id)) {
            throw new IllegalArgumentException("“" + e.getNombre() + "” está en una o más rutinas: desactivalo en lugar de borrarlo");
        }
        com.example.gymtrack_backend.auditoria.AuditoriaInterceptor.detalle(e.getNombre());
        ejercicioRepo.delete(e);
    }

    // ── Posibles duplicados: nombres casi iguales ────────────────────────────

    private static List<List<Item>> duplicados(List<Ejercicio> todos) {
        List<Ejercicio> lista = todos.stream().sorted(Comparator.comparing(Ejercicio::getId)).toList();
        boolean[] usado = new boolean[lista.size()];
        List<List<Item>> grupos = new ArrayList<>();
        for (int i = 0; i < lista.size(); i++) {
            if (usado[i]) continue;
            String a = clave(lista.get(i).getNombre());
            List<Item> grupo = new ArrayList<>(List.of(item(lista.get(i))));
            for (int j = i + 1; j < lista.size(); j++) {
                if (!usado[j] && parecidos(a, clave(lista.get(j).getNombre()))) {
                    grupo.add(item(lista.get(j)));
                    usado[j] = true;
                }
            }
            if (grupo.size() > 1) grupos.add(grupo);
        }
        return grupos;
    }

    /** Minúsculas, sin acentos, sin lo que está entre paréntesis y sin palabras vacías */
    static String clave(String nombre) {
        String s = Normalizer.normalize(nombre == null ? "" : nombre, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        s = s.toLowerCase().replaceAll("\\(.*?\\)", " ").replaceAll("[^a-z0-9 ]", " ");
        return Arrays.stream(s.trim().split("\\s+")).filter(w -> !w.isBlank() && !VACIAS.contains(w))
                .reduce((x, y) -> x + " " + y).orElse("");
    }

    static boolean parecidos(String a, String b) {
        if (a.isEmpty() || b.isEmpty()) return false;
        if (a.equals(b)) return true;
        int max = Math.max(a.length(), b.length());
        return max >= 6 && 1.0 - (double) distancia(a, b) / max >= 0.9;
    }

    private static int distancia(String a, String b) {
        int[] prev = new int[b.length() + 1], cur = new int[b.length() + 1];
        for (int j = 0; j <= b.length(); j++) prev[j] = j;
        for (int i = 1; i <= a.length(); i++) {
            cur[0] = i;
            for (int j = 1; j <= b.length(); j++) {
                int costo = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                cur[j] = Math.min(Math.min(cur[j - 1] + 1, prev[j] + 1), prev[j - 1] + costo);
            }
            int[] t = prev; prev = cur; cur = t;
        }
        return prev[b.length()];
    }

    private static Item item(Ejercicio e) {
        return new Item(e.getId(), e.getNombre().trim(), Boolean.TRUE.equals(e.getActivo()), Boolean.TRUE.equals(e.getEsMaquina()));
    }
}
