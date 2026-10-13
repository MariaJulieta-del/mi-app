package com.example.gymtrack_backend.service;

import com.example.gymtrack_backend.entities.Asistencia;
import com.example.gymtrack_backend.entities.Socio;
import com.example.gymtrack_backend.repository.AsistenciaRepository;
import com.example.gymtrack_backend.repository.SocioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.Period;
import java.util.*;

/**
 * Quién viene al gimnasio: edad y género de los socios activos y a qué hora entrena cada grupo.
 * Las visitas salen de los ingresos (asistencias de ENTRADA permitidas) de los últimos N días.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DemografiaService {

    private final SocioRepository socioRepo;
    private final AsistenciaRepository asistenciaRepo;

    /** Rangos de edad: [desde, hasta] inclusive */
    static final int[][] RANGOS = {{0, 17}, {18, 24}, {25, 34}, {35, 44}, {45, 59}, {60, 200}};
    static final String[] NOMBRES_RANGO = {"Menos de 18", "18 a 24", "25 a 34", "35 a 44", "45 a 59", "60 o más"};
    /** Franjas horarias: [desde, hasta) en horas */
    static final int[][] FRANJAS = {{0, 9}, {9, 12}, {12, 15}, {15, 18}, {18, 21}, {21, 24}};
    static final String[] NOMBRES_FRANJA = {"Antes de las 9", "9 a 12", "12 a 15", "15 a 18", "18 a 21", "Después de las 21"};
    static final Map<String, String> GENEROS = new LinkedHashMap<>();
    static {
        GENEROS.put("FEMENINO", "Femenino");
        GENEROS.put("MASCULINO", "Masculino");
        GENEROS.put("NO_BINARIO", "No binario");
    }

    /**
     * Un grupo de socios (un género o un rango de edad).
     * visitasPorSemana: promedio de ingresos por semana de cada socio del grupo.
     * franjas: % de las visitas del grupo en cada franja horaria (suma 100).
     */
    public record Grupo(String clave, String nombre, int socios, Integer porcentaje, Double edadPromedio,
                       int visitas, Double visitasPorSemana, List<Integer> franjas, String horaPico, String horaPromedio) {}

    /** Por franja horaria: cuánta gente viene y qué edad tiene en promedio */
    public record Franja(String nombre, int visitas, Integer porcentaje, Double edadPromedio) {}

    public record Demografia(int dias, int sociosActivos, int conEdad, int conGenero, Double edadPromedio,
                             Integer edadMinima, Integer edadMaxima, List<String> nombresFranjas,
                             List<Grupo> generos, List<Grupo> edades, List<Franja> franjas, int visitas) {}

    public Demografia demografia(int dias) {
        int d = Math.max(7, Math.min(365, dias));
        LocalDate hoy = LocalDate.now();
        // Solo socio y hora de cada ingreso (miles de filas: sin cargar entidades)
        List<Asistencia> visitas = new ArrayList<>();
        Map<Long, Socio> refs = new HashMap<>();
        for (Object[] f : asistenciaRepo.horasDeIngresoEntre(hoy.minusDays(d), hoy.minusDays(1))) {
            Asistencia a = new Asistencia();
            a.setSocio(refs.computeIfAbsent((Long) f[0], id -> { Socio s = new Socio(); s.setId(id); return s; }));
            a.setHora((LocalTime) f[1]);
            a.setTipo("ENTRADA");
            a.setPermitido(true);
            visitas.add(a);
        }
        return calcular(socioRepo.findAll(), visitas, hoy, d);
    }

    static Integer edad(Socio s, LocalDate hoy) {
        if (s.getFechaNacimiento() == null || s.getFechaNacimiento().isAfter(hoy)) return null;
        return Period.between(s.getFechaNacimiento(), hoy).getYears();
    }

    static int rango(int edad) {
        for (int i = 0; i < RANGOS.length; i++) if (edad >= RANGOS[i][0] && edad <= RANGOS[i][1]) return i;
        return RANGOS.length - 1;
    }

    static int franja(LocalTime hora) {
        int h = hora.getHour();
        for (int i = 0; i < FRANJAS.length; i++) if (h >= FRANJAS[i][0] && h < FRANJAS[i][1]) return i;
        return FRANJAS.length - 1;
    }

    private static Double redondear(double v) { return Math.round(v * 10) / 10.0; }

    static Demografia calcular(List<Socio> todos, List<Asistencia> asistencias, LocalDate hoy, int dias) {
        List<Socio> activos = todos.stream().filter(s -> Boolean.TRUE.equals(s.getActivo())).toList();
        Map<Long, Socio> porId = new HashMap<>();
        todos.forEach(s -> porId.put(s.getId(), s));

        // Solo ingresos válidos
        List<Asistencia> entradas = asistencias.stream()
                .filter(a -> Boolean.TRUE.equals(a.getPermitido()) && "ENTRADA".equals(a.getTipo())
                        && a.getHora() != null && a.getSocio() != null && porId.containsKey(a.getSocio().getId()))
                .toList();

        List<Integer> edades = activos.stream().map(s -> edad(s, hoy)).filter(Objects::nonNull).toList();
        Double promedio = edades.isEmpty() ? null : redondear(edades.stream().mapToInt(Integer::intValue).average().orElse(0));

        // Por género
        List<Grupo> generos = new ArrayList<>();
        for (var g : GENEROS.entrySet()) {
            generos.add(grupo(g.getKey(), g.getValue(), activos, entradas, porId, hoy, dias,
                    s -> g.getKey().equals(s.getGenero())));
        }
        // Por rango de edad
        List<Grupo> rangos = new ArrayList<>();
        for (int i = 0; i < RANGOS.length; i++) {
            final int r = i;
            rangos.add(grupo(String.valueOf(i), NOMBRES_RANGO[i], activos, entradas, porId, hoy, dias,
                    s -> { Integer e = edad(s, hoy); return e != null && rango(e) == r; }));
        }
        // Completar porcentajes sobre el total de activos con el dato
        int conGenero = generos.stream().mapToInt(Grupo::socios).sum();
        generos = generos.stream().map(g -> conPorcentaje(g, conGenero)).toList();
        int conEdad = edades.size();
        rangos = rangos.stream().map(g -> conPorcentaje(g, conEdad)).toList();

        // Por franja horaria: visitas y edad promedio de los que vienen
        int[] visitasFranja = new int[FRANJAS.length];
        double[] sumaEdad = new double[FRANJAS.length];
        int[] conEdadFranja = new int[FRANJAS.length];
        for (Asistencia a : entradas) {
            int f = franja(a.getHora());
            visitasFranja[f]++;
            Integer e = edad(porId.get(a.getSocio().getId()), hoy);
            if (e != null) { sumaEdad[f] += e; conEdadFranja[f]++; }
        }
        List<Franja> franjas = new ArrayList<>();
        for (int i = 0; i < FRANJAS.length; i++) {
            franjas.add(new Franja(NOMBRES_FRANJA[i], visitasFranja[i],
                    entradas.isEmpty() ? null : Math.round(visitasFranja[i] * 100f / entradas.size()),
                    conEdadFranja[i] == 0 ? null : redondear(sumaEdad[i] / conEdadFranja[i])));
        }

        return new Demografia(dias, activos.size(), conEdad, conGenero, promedio,
                edades.stream().min(Integer::compare).orElse(null), edades.stream().max(Integer::compare).orElse(null),
                List.of(NOMBRES_FRANJA), generos, rangos, franjas, entradas.size());
    }

    private static Grupo conPorcentaje(Grupo g, int total) {
        return new Grupo(g.clave(), g.nombre(), g.socios(), total == 0 ? null : Math.round(g.socios() * 100f / total),
                g.edadPromedio(), g.visitas(), g.visitasPorSemana(), g.franjas(), g.horaPico(), g.horaPromedio());
    }

    private static Grupo grupo(String clave, String nombre, List<Socio> activos, List<Asistencia> entradas,
                               Map<Long, Socio> porId, LocalDate hoy, int dias, java.util.function.Predicate<Socio> es) {
        List<Socio> miembros = activos.stream().filter(es).toList();
        List<Integer> edades = miembros.stream().map(s -> edad(s, hoy)).filter(Objects::nonNull).toList();
        // Las visitas cuentan aunque hoy el socio esté inactivo: vino en el período
        List<Asistencia> suyas = entradas.stream().filter(a -> es.test(porId.get(a.getSocio().getId()))).toList();

        int[] porFranja = new int[FRANJAS.length];
        int[] porHora = new int[24];
        long minutos = 0;
        for (Asistencia a : suyas) {
            porFranja[franja(a.getHora())]++;
            porHora[a.getHora().getHour()]++;
            minutos += a.getHora().getHour() * 60L + a.getHora().getMinute();
        }
        List<Integer> pct = new ArrayList<>();
        for (int f : porFranja) pct.add(suyas.isEmpty() ? 0 : Math.round(f * 100f / suyas.size()));

        String pico = null;
        if (!suyas.isEmpty()) {
            int h = 0;
            for (int i = 1; i < 24; i++) if (porHora[i] > porHora[h]) h = i;
            pico = String.format("%02d:00", h);
        }
        String horaProm = null;
        if (!suyas.isEmpty()) {
            long m = Math.round((double) minutos / suyas.size());
            horaProm = String.format("%02d:%02d", m / 60, m % 60);
        }
        // Promedio semanal de los socios activos del grupo
        Set<Long> ids = new HashSet<>();
        miembros.forEach(s -> ids.add(s.getId()));
        Double porSemana = miembros.isEmpty() ? null
                : redondear(suyas.stream().filter(a -> ids.contains(a.getSocio().getId())).count()
                        / (double) miembros.size() / (dias / 7.0));

        return new Grupo(clave, nombre, miembros.size(), null,
                edades.isEmpty() ? null : redondear(edades.stream().mapToInt(Integer::intValue).average().orElse(0)),
                suyas.size(), porSemana, pct, pico, horaProm);
    }
}
