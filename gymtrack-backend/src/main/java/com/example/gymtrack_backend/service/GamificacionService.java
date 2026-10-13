package com.example.gymtrack_backend.service;

import com.example.gymtrack_backend.entities.Asistencia;
import com.example.gymtrack_backend.entities.SesionEntrenamiento;
import com.example.gymtrack_backend.entities.Socio;
import com.example.gymtrack_backend.repository.AsistenciaRepository;
import com.example.gymtrack_backend.repository.SesionEntrenamientoRepository;
import com.example.gymtrack_backend.repository.SocioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.temporal.TemporalAdjusters;
import java.util.*;

/**
 * Insignias, desafío del mes y ranking (opcional) para que el socio quiera volver.
 * Un "día entrenado" es un día con ingreso al gimnasio o con un entrenamiento terminado en la app.
 * Las rachas son semanales (una semana con al menos un día cuenta): una racha diaria se corta con el primer resfrío.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GamificacionService {

    /** Días a entrenar en el mes para ganar el desafío (unos 3 por semana) */
    public static final int META_DESAFIO = 12;
    private static final LocalTime TEMPRANO = LocalTime.of(8, 0);

    private final AsistenciaRepository asistenciaRepo;
    private final SesionEntrenamientoRepository sesionRepo;
    private final SocioRepository socioRepo;

    public record Insignia(String codigo, String titulo, String descripcion, String icono, boolean obtenida, int progreso, int meta) {}
    public record Desafio(String titulo, int meta, int actual, int diasRestantes, boolean completado) {}
    public record Logros(int diasEntrenados, int rachaActual, int mejorRacha, int records, List<Insignia> insignias,
                         Desafio desafio, int desafiosGanados, boolean rankingVisible) {}

    public Logros logros(Long socioId) {
        Socio socio = socioRepo.findById(socioId).orElseThrow(() -> new IllegalArgumentException("Socio no encontrado"));
        LocalDate hoy = LocalDate.now();

        List<Asistencia> ingresos = asistenciaRepo.findBySocioIdOrderByFechaDescHoraDesc(socioId).stream()
                .filter(a -> Boolean.TRUE.equals(a.getPermitido()) && "ENTRADA".equals(a.getTipo())).toList();
        List<SesionEntrenamiento> sesiones = sesionRepo.findBySocioIdOrderByFechaDescCreadaDesc(socioId);

        SortedSet<LocalDate> dias = new TreeSet<>();
        ingresos.forEach(a -> dias.add(a.getFecha()));
        sesiones.forEach(s -> dias.add(s.getFecha()));

        int total = dias.size();
        int[] rachas = rachas(dias, hoy);
        int records = sesiones.stream().mapToInt(s -> s.getRecords() == null ? 0 : s.getRecords()).sum();
        int tempranos = (int) ingresos.stream().filter(a -> a.getHora() != null && a.getHora().isBefore(TEMPRANO))
                .map(Asistencia::getFecha).distinct().count();

        // Desafío del mes y meses ganados antes
        YearMonth mes = YearMonth.from(hoy);
        Map<YearMonth, Integer> porMes = new HashMap<>();
        dias.forEach(d -> porMes.merge(YearMonth.from(d), 1, Integer::sum));
        int actual = porMes.getOrDefault(mes, 0);
        int ganados = (int) porMes.entrySet().stream().filter(e -> e.getValue() >= META_DESAFIO).count();
        Desafio desafio = new Desafio("Entrená " + META_DESAFIO + " días este mes", META_DESAFIO, actual,
                mes.lengthOfMonth() - hoy.getDayOfMonth(), actual >= META_DESAFIO);

        List<Insignia> insignias = new ArrayList<>();
        insignias.add(ins("PRIMER_DIA", "Primer paso", "Tu primer entrenamiento", "sprout", total, 1));
        insignias.add(ins("DIAS_10", "Arrancaste", "10 días entrenados", "dumbbell", total, 10));
        insignias.add(ins("DIAS_25", "Constante", "25 días entrenados", "flame", total, 25));
        insignias.add(ins("DIAS_50", "Imparable", "50 días entrenados", "rocket", total, 50));
        insignias.add(ins("DIAS_100", "Centenario", "100 días entrenados", "trophy", total, 100));
        insignias.add(ins("RACHA_4", "Un mes sin fallar", "4 semanas seguidas entrenando", "calendar-check", rachas[1], 4));
        insignias.add(ins("RACHA_12", "Hábito formado", "12 semanas seguidas entrenando", "brick-wall", rachas[1], 12));
        insignias.add(ins("RECORD_1", "Nuevo récord", "Superaste tu mejor marca", "star", records, 1));
        insignias.add(ins("RECORD_10", "Coleccionista", "10 récords personales", "sparkles", records, 10));
        insignias.add(ins("DESAFIO_1", "Desafío cumplido", "Ganaste un desafío del mes", "target", ganados, 1));
        insignias.add(ins("TEMPRANO_10", "Madrugador", "10 entrenamientos antes de las 8", "sunrise", tempranos, 10));

        return new Logros(total, rachas[0], rachas[1], records, insignias, desafio, ganados, Boolean.TRUE.equals(socio.getRankingVisible()));
    }

    private static Insignia ins(String codigo, String titulo, String desc, String icono, int valor, int meta) {
        return new Insignia(codigo, titulo, desc, icono, valor >= meta, Math.min(valor, meta), meta);
    }

    /** {racha actual, mejor racha} en semanas. La semana en curso no corta la racha (todavía puede venir). */
    static int[] rachas(SortedSet<LocalDate> dias, LocalDate hoy) {
        if (dias.isEmpty()) return new int[]{0, 0};
        Set<LocalDate> semanas = new HashSet<>();
        dias.forEach(d -> semanas.add(d.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))));
        LocalDate esta = hoy.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        int actual = 0;
        LocalDate s = semanas.contains(esta) ? esta : esta.minusWeeks(1);
        while (semanas.contains(s)) { actual++; s = s.minusWeeks(1); }

        int mejor = 0, corrida = 0;
        LocalDate prev = null;
        for (LocalDate w : new TreeSet<>(semanas)) {
            corrida = (prev != null && prev.plusWeeks(1).equals(w)) ? corrida + 1 : 1;
            mejor = Math.max(mejor, corrida);
            prev = w;
        }
        return new int[]{actual, Math.max(mejor, actual)};
    }

    // ── Ranking del mes ──────────────────────────────────────────────────────

    public record Puesto(int posicion, Long socioId, String nombre, int dias, boolean esVos) {}
    public record Ranking(String mes, List<Puesto> top, Puesto tuPuesto, int participantes) {}

    /** Días entrenados en el mes por los socios que eligieron aparecer. Se muestra nombre e inicial del apellido. */
    public Ranking ranking(Long socioConsulta) {
        LocalDate hoy = LocalDate.now();
        LocalDate desde = hoy.withDayOfMonth(1);
        Map<Long, Set<LocalDate>> dias = new HashMap<>();
        Map<Long, Socio> socios = new HashMap<>();
        for (Asistencia a : asistenciaRepo.findByFechaBetweenOrderByFechaDescHoraDesc(desde, hoy)) {
            if (!Boolean.TRUE.equals(a.getPermitido()) || !"ENTRADA".equals(a.getTipo())) continue;
            dias.computeIfAbsent(a.getSocio().getId(), k -> new HashSet<>()).add(a.getFecha());
            socios.putIfAbsent(a.getSocio().getId(), a.getSocio());
        }
        for (SesionEntrenamiento s : sesionRepo.entre(desde, hoy)) {
            dias.computeIfAbsent(s.getSocio().getId(), k -> new HashSet<>()).add(s.getFecha());
            socios.putIfAbsent(s.getSocio().getId(), s.getSocio());
        }
        List<Map.Entry<Long, Set<LocalDate>>> lista = dias.entrySet().stream()
                .filter(e -> {
                    Socio so = socios.get(e.getKey());
                    return Boolean.TRUE.equals(so.getActivo()) && Boolean.TRUE.equals(so.getRankingVisible());
                })
                .sorted(Comparator.comparingInt((Map.Entry<Long, Set<LocalDate>> e) -> -e.getValue().size())
                        .thenComparing(e -> socios.get(e.getKey()).getNombre()))
                .toList();

        List<Puesto> puestos = new ArrayList<>();
        int pos = 0, anterior = -1;
        for (int i = 0; i < lista.size(); i++) {
            int d = lista.get(i).getValue().size();
            if (d != anterior) { pos = i + 1; anterior = d; }   // empates comparten puesto
            Socio so = socios.get(lista.get(i).getKey());
            String nombre = so.getNombre() + (so.getApellido() != null && !so.getApellido().isBlank() ? " " + so.getApellido().charAt(0) + "." : "");
            puestos.add(new Puesto(pos, so.getId(), nombre, d, so.getId().equals(socioConsulta)));
        }
        Puesto tuyo = puestos.stream().filter(Puesto::esVos).findFirst().orElse(null);
        return new Ranking(YearMonth.from(hoy).toString(), puestos.stream().limit(10).toList(), tuyo, puestos.size());
    }

    @Transactional
    public boolean participar(Long socioId, boolean participa) {
        Socio s = socioRepo.findById(socioId).orElseThrow(() -> new IllegalArgumentException("Socio no encontrado"));
        s.setRankingVisible(participa);
        socioRepo.save(s);
        return participa;
    }
}
