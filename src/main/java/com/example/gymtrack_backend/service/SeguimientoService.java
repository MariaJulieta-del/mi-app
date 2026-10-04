package com.example.gymtrack_backend.service;

import com.example.gymtrack_backend.entities.Asistencia;
import com.example.gymtrack_backend.entities.FichaMedica;
import com.example.gymtrack_backend.entities.Membresia;
import com.example.gymtrack_backend.entities.Rutina;
import com.example.gymtrack_backend.entities.Socio;
import com.example.gymtrack_backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Seguimiento de entrenamiento:
 *  - "Hoy": lo que ve el profesor al abrir la app (quién está entrenando y a quién atender).
 *  - Progreso de un socio: cargas por ejercicio y asistencia semanal.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SeguimientoService {

    /** Una rutina con más semanas que esto se sugiere renovar */
    public static final int SEMANAS_RENOVAR_RUTINA = 6;
    /** Se consideran "activos" los socios que vinieron en estos últimos días */
    private static final int DIAS_ACTIVIDAD = 14;

    private final AsistenciaRepository        asistenciaRepo;
    private final RutinaRepository            rutinaRepo;
    private final FichaMedicaRepository       fichaRepo;
    private final MembresiaRepository         membresiaRepo;
    private final ProgresoEjercicioRepository progresoRepo;
    private final SocioRepository             socioRepo;

    // ── Hoy ──────────────────────────────────────────────────────────────────

    public record RutinaResumen(Long id, String nombre, long semanas) {}
    public record SocioHoy(Long socioId, String nombre, LocalTime hora, String alertaMedica,
                           RutinaResumen rutina, Long diasParaVencer) {}
    public record SocioARenovar(Long socioId, String nombre, String motivo, Long semanas, LocalDate ultimaVisita) {}
    public record Hoy(int ingresosHoy, int denegadosHoy, List<SocioHoy> entrenando,
                      List<SocioARenovar> renovarRutina, int semanasRenovar) {}

    public Hoy hoy() {
        LocalDate hoy = LocalDate.now();
        List<Asistencia> deHoy = asistenciaRepo.findByFechaOrderByHoraDesc(hoy);

        // Un socio por fila (su primer ingreso permitido del día)
        Map<Long, Asistencia> porSocio = new LinkedHashMap<>();
        deHoy.stream()
                .filter(a -> "ENTRADA".equals(a.getTipo()) && Boolean.TRUE.equals(a.getPermitido()))
                .sorted(Comparator.comparing(Asistencia::getHora))
                .forEach(a -> porSocio.putIfAbsent(a.getSocio().getId(), a));

        List<SocioHoy> entrenando = porSocio.values().stream()
                .sorted(Comparator.comparing(Asistencia::getHora).reversed())
                .map(a -> {
                    Socio s = a.getSocio();
                    Membresia m = membresiaRepo.findBySocioId(s.getId()).orElse(null);
                    return new SocioHoy(s.getId(), nombreDe(s), a.getHora(),
                            alertaMedica(s.getId()), rutinaActual(s.getId(), hoy),
                            m != null ? ChronoUnit.DAYS.between(hoy, m.getFechaVencimiento()) : null);
                })
                .toList();

        int denegados = (int) deHoy.stream().filter(a -> !Boolean.TRUE.equals(a.getPermitido())).count();
        return new Hoy(porSocio.size(), denegados, entrenando, aRenovar(hoy), SEMANAS_RENOVAR_RUTINA);
    }

    /** Socios que vienen seguido y no tienen rutina, o la tienen hace mucho */
    private List<SocioARenovar> aRenovar(LocalDate hoy) {
        Map<Long, LocalDate> ultimaVisita = new LinkedHashMap<>();
        Map<Long, Socio> socios = new HashMap<>();
        for (Asistencia a : asistenciaRepo.findByFechaBetweenOrderByFechaDescHoraDesc(hoy.minusDays(DIAS_ACTIVIDAD), hoy)) {
            if (!Boolean.TRUE.equals(a.getPermitido()) || !Boolean.TRUE.equals(a.getSocio().getActivo())) continue;
            ultimaVisita.putIfAbsent(a.getSocio().getId(), a.getFecha());
            socios.putIfAbsent(a.getSocio().getId(), a.getSocio());
        }
        List<SocioARenovar> lista = new ArrayList<>();
        for (var e : ultimaVisita.entrySet()) {
            Socio s = socios.get(e.getKey());
            RutinaResumen r = rutinaActual(s.getId(), hoy);
            if (r == null) {
                lista.add(new SocioARenovar(s.getId(), nombreDe(s), "SIN_RUTINA", null, e.getValue()));
            } else if (r.semanas() >= SEMANAS_RENOVAR_RUTINA) {
                lista.add(new SocioARenovar(s.getId(), nombreDe(s), "RUTINA_VIEJA", r.semanas(), e.getValue()));
            }
        }
        // Primero los que no tienen rutina, después las más viejas
        lista.sort(Comparator.comparing((SocioARenovar x) -> !"SIN_RUTINA".equals(x.motivo()))
                .thenComparing(x -> -(x.semanas() == null ? 0 : x.semanas())));
        return lista;
    }

    private RutinaResumen rutinaActual(Long socioId, LocalDate hoy) {
        return rutinaRepo.findBySocioId(socioId).stream()
                .filter(r -> r.getFechaCreacion() != null)
                .max(Comparator.comparing(Rutina::getFechaCreacion))
                .map(r -> new RutinaResumen(r.getId(), r.getNombre(),
                        ChronoUnit.WEEKS.between(r.getFechaCreacion().toLocalDate(), hoy)))
                .orElse(null);
    }

    private String alertaMedica(Long socioId) {
        FichaMedica f = fichaRepo.findBySocioId(socioId).orElse(null);
        if (f == null) return null;
        String txt = unir(f.getLesiones(), f.getObservacionesMedicas());
        return txt.isBlank() ? null : txt;
    }

    private static String unir(String... partes) {
        return Arrays.stream(partes).filter(p -> p != null && !p.isBlank()).map(String::trim)
                .collect(Collectors.joining(" · "));
    }

    private static String nombreDe(Socio s) {
        return s.getNombre() + " " + s.getApellido();
    }

    // ── Progreso de un socio ─────────────────────────────────────────────────

    public record Registro(LocalDate fecha, BigDecimal pesoKg, Integer repeticiones, Integer series) {}
    public record EjercicioProgreso(String ejercicio, List<Registro> registros,
                                    BigDecimal pesoInicial, BigDecimal pesoActual, BigDecimal pesoMaximo,
                                    LocalDate ultimaVez) {}
    public record SemanaAsistencia(LocalDate inicio, int dias) {}
    public record Progreso(Long socioId, List<EjercicioProgreso> ejercicios, List<SemanaAsistencia> semanas,
                           int rachaSemanas, int diasEsteMes, int sesionesRegistradas) {}

    public Progreso progresoSocio(Long socioId) {
        socioRepo.findById(socioId).orElseThrow(() -> new IllegalArgumentException("Socio no encontrado"));

        // Cargas agrupadas por nombre de ejercicio: el historial sigue aunque cambie la rutina
        Map<String, List<com.example.gymtrack_backend.entities.ProgresoEjercicio>> porEjercicio = new LinkedHashMap<>();
        for (var p : progresoRepo.findBySocioIdOrderByFechaAsc(socioId)) {
            if (p.getRutinaEjercicio() == null || p.getRutinaEjercicio().getNombreEjercicio() == null) continue;
            porEjercicio.computeIfAbsent(p.getRutinaEjercicio().getNombreEjercicio().trim(), k -> new ArrayList<>()).add(p);
        }

        List<EjercicioProgreso> ejercicios = porEjercicio.entrySet().stream().map(e -> {
            // Un registro por día: el de mayor peso
            Map<LocalDate, com.example.gymtrack_backend.entities.ProgresoEjercicio> porDia = new TreeMap<>();
            for (var p : e.getValue()) {
                porDia.merge(p.getFecha(), p, (a, b) -> comparar(b.getPesoKg(), a.getPesoKg()) > 0 ? b : a);
            }
            List<Registro> regs = porDia.values().stream()
                    .map(p -> new Registro(p.getFecha(), p.getPesoKg(), p.getRepeticionesReales(), p.getSeriesRealizadas()))
                    .toList();
            List<BigDecimal> pesos = regs.stream().map(Registro::pesoKg).filter(Objects::nonNull).toList();
            return new EjercicioProgreso(e.getKey(), regs,
                    pesos.isEmpty() ? null : pesos.get(0),
                    pesos.isEmpty() ? null : pesos.get(pesos.size() - 1),
                    pesos.stream().max(BigDecimal::compareTo).orElse(null),
                    regs.isEmpty() ? null : regs.get(regs.size() - 1).fecha());
        })
        // Los entrenados más recientemente primero
        .sorted(Comparator.comparing(EjercicioProgreso::ultimaVez, Comparator.nullsLast(Comparator.reverseOrder())))
        .toList();

        // Asistencia de las últimas 12 semanas (de lunes a domingo)
        LocalDate hoy = LocalDate.now();
        LocalDate desde = hoy.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).minusWeeks(11);
        Set<LocalDate> diasConIngreso = asistenciaRepo.findBySocioIdOrderByFechaDescHoraDesc(socioId).stream()
                .filter(a -> Boolean.TRUE.equals(a.getPermitido()) && "ENTRADA".equals(a.getTipo()))
                .map(Asistencia::getFecha)
                .collect(Collectors.toSet());
        List<SemanaAsistencia> semanas = new ArrayList<>();
        for (int i = 0; i < 12; i++) {
            LocalDate ini = desde.plusWeeks(i);
            LocalDate fin = ini.plusWeeks(1);
            int dias = (int) diasConIngreso.stream().filter(d -> !d.isBefore(ini) && d.isBefore(fin)).count();
            semanas.add(new SemanaAsistencia(ini, dias));
        }

        // Racha: semanas seguidas con al menos un ingreso. La semana en curso no la corta (todavía puede venir).
        int racha = 0;
        for (int i = semanas.size() - 1; i >= 0; i--) {
            if (semanas.get(i).dias() > 0) racha++;
            else if (i != semanas.size() - 1) break;
        }
        int diasMes = (int) diasConIngreso.stream()
                .filter(d -> d.getYear() == hoy.getYear() && d.getMonth() == hoy.getMonth()).count();
        int sesiones = (int) porEjercicio.values().stream().flatMap(List::stream)
                .map(com.example.gymtrack_backend.entities.ProgresoEjercicio::getFecha).distinct().count();

        return new Progreso(socioId, ejercicios, semanas, racha, diasMes, sesiones);
    }

    private static int comparar(BigDecimal a, BigDecimal b) {
        if (a == null) return b == null ? 0 : -1;
        if (b == null) return 1;
        return a.compareTo(b);
    }
}
