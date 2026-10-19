package com.example.gymtrack_backend.service;

import com.example.gymtrack_backend.entities.*;
import com.example.gymtrack_backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Retención automática. Todos los días revisa a cada socio y, según el caso:
 *  - le manda un aviso en su app (motivación, recordatorios), o
 *  - le deja al staff una tarea con el mensaje de WhatsApp ya escrito.
 *
 * Casos:
 *  - Primeros 30 días (es cuando más gente abandona): día 3 sin venir, día 7, día 14, fin del primer mes con pocas visitas.
 *  - Ausencia: se compara con su propia frecuencia (al que viene 4 veces por semana se lo extraña antes).
 *  - Rutina: sin rutina o con la misma hace más de 6 semanas (aburrirse es un motivo común de baja).
 *  - (La membresía por vencer la avisa RecordatorioCuotaService.)
 *  - Bajas: a los 30, 60 y 90 días, un mensaje para que vuelva según el motivo por el que se fue.
 *
 * Cada caso se registra una sola vez por período para no repetir mensajes.
 */
@Service
@RequiredArgsConstructor
public class RetencionService {

    private static final Logger log = LoggerFactory.getLogger(RetencionService.class);

    private final SocioRepository socioRepo;
    private final MembresiaRepository membresiaRepo;
    private final MembresiaService membresiaService;
    private final AsistenciaRepository asistenciaRepo;
    private final ReglasRutina reglas;
    private final RutinaRepository rutinaRepo;
    private final RutinasDelSocio rutinasDelSocio;
    private final BajaSocioRepository bajaRepo;
    private final AccionRetencionRepository accionRepo;
    private final NotificacionRepository notificacionRepo;
    private final SesionEntrenamientoRepository sesionRepo;

    /** Qué se le muestra al staff para cada tipo de tarea */
    public static final Map<String, String> TITULOS = Map.ofEntries(
            Map.entry("NUEVO_SIN_VENIR", "Se anotó y todavía no vino"),
            Map.entry("SEGUIMIENTO_14", "Dos semanas desde que arrancó"),
            Map.entry("POCAS_VISITAS", "Primer mes con pocas visitas"),
            Map.entry("AUSENCIA_LLAMAR", "Dejó de venir"),
            Map.entry("SIN_RUTINA", "Viene y no tiene rutina"),
            Map.entry("RUTINA_VIEJA", "Rutina para renovar"),
            Map.entry("RECUPERO_30", "Se fue hace un mes"),
            Map.entry("RECUPERO_60", "Se fue hace dos meses"),
            Map.entry("RECUPERO_90", "Se fue hace tres meses"));

    public record Generadas(int avisosApp, int tareas) {}

    /** Todos los días a las 9 */
    @Scheduled(cron = "0 0 9 * * *")
    public void diario() {
        Generadas g = generar();
        log.info("Retención: {} avisos en la app, {} tareas para el staff", g.avisosApp(), g.tareas());
    }

    @Transactional
    public Generadas generar() {
        LocalDate hoy = LocalDate.now();
        int[] cuenta = new int[2];

        // Días entrenados de cada socio (ingresos y entrenamientos terminados en la app)
        Map<Long, TreeSet<LocalDate>> dias = new HashMap<>();
        for (Asistencia a : asistenciaRepo.findByFechaBetweenOrderByFechaDescHoraDesc(hoy.minusDays(180), hoy)) {
            if (Boolean.TRUE.equals(a.getPermitido()) && "ENTRADA".equals(a.getTipo())) {
                dias.computeIfAbsent(a.getSocio().getId(), k -> new TreeSet<>()).add(a.getFecha());
            }
        }
        for (SesionEntrenamiento s : sesionRepo.entre(hoy.minusDays(180), hoy)) {
            dias.computeIfAbsent(s.getSocio().getId(), k -> new TreeSet<>()).add(s.getFecha());
        }

        for (Socio s : socioRepo.findByActivoTrue()) {
            Membresia m = membresiaRepo.findBySocioId(s.getId()).orElse(null);
            if (m == null || !membresiaService.estaVigente(m, hoy)) continue;   // sin plan vigente lo maneja recepción
            TreeSet<LocalDate> vino = dias.getOrDefault(s.getId(), new TreeSet<>());
            String nombre = s.getNombre();

            LocalDate alta = s.getFechaCreacion() != null ? s.getFechaCreacion().toLocalDate()
                    : m.getFechaInicio() != null ? m.getFechaInicio() : hoy;
            long diasDesdeAlta = ChronoUnit.DAYS.between(alta, hoy);
            long visitasMes1 = vino.stream().filter(d -> !d.isBefore(alta) && d.isBefore(alta.plusDays(30))).count();

            // ── Primeros 30 días ──
            if (diasDesdeAlta >= 3 && diasDesdeAlta <= 6) {
                if (vino.isEmpty()) tarea(s, "NUEVO_SIN_VENIR", 60, "¡Hola " + nombre + "! ¿Cómo estás? Te esperamos para tu primer entrenamiento: avisanos qué horario te queda cómodo y te armamos la rutina", cuenta);
                else aviso(s, "BIENVENIDA_3", 60, "¡Buen arranque!", "Ya entrenaste " + vino.size() + (vino.size() == 1 ? " vez" : " veces") + ". Los primeros días son los que arman el hábito: apuntá a 2 o 3 por semana.", cuenta);
            }
            if (diasDesdeAlta >= 7 && diasDesdeAlta <= 9) {
                aviso(s, "PRUEBA_CLASE", 60, "¿Probaste una clase?", "Además del salón tenés clases grupales. Mirá los horarios en \"Clases\" y reservá tu lugar desde la app.", cuenta);
            }
            if (diasDesdeAlta >= 14 && diasDesdeAlta <= 16) {
                tarea(s, "SEGUIMIENTO_14", 60, "¡Hola " + nombre + "! Ya van dos semanas desde que arrancaste. ¿Cómo te sentís con la rutina? Si querés ajustamos algo.", cuenta);
            }
            if (diasDesdeAlta >= 25 && diasDesdeAlta <= 30 && visitasMes1 < 4) {
                tarea(s, "POCAS_VISITAS", 60, "¡Hola " + nombre + "! Vimos que este primer mes viniste poco. ¿Te podemos ayudar con horarios o con la rutina? La idea es que le encuentres el gusto.", cuenta);
            }

            // ── Ausencia (comparada con su propia frecuencia) ──
            if (vino.size() >= 3 && diasDesdeAlta > 14) {
                LocalDate ultima = vino.last();
                long sinVenir = ChronoUnit.DAYS.between(ultima, hoy);
                double frecuencia = frecuenciaHabitual(vino, hoy);
                if (sinVenir >= Math.max(5, Math.round(frecuencia * 2.5)) && sinVenir < 10) {
                    aviso(s, "AUSENCIA_AVISO", 21, "Te extrañamos", "Hace " + sinVenir + " días que no venís. ¡Tu rutina te espera! Volver es más fácil de lo que parece.", cuenta);
                }
                if (sinVenir >= Math.max(10, Math.round(frecuencia * 4))) {
                    tarea(s, "AUSENCIA_LLAMAR", 30, "¡Hola " + nombre + "! Hace " + sinVenir + " días que no te vemos por el gimnasio. ¿Todo bien? Si necesitás cambiar horarios o la rutina, decinos y lo armamos.", cuenta);
                }
            }

            // ── Rutina ──
            if (!vino.isEmpty() && ChronoUnit.DAYS.between(vino.last(), hoy) <= 14) {
                var actual = rutinasDelSocio.actual(s.getId()).orElse(null);
                if (actual == null) {
                    tarea(s, "SIN_RUTINA", 30, "¡Hola " + nombre + "! Vimos que todavía no tenés una rutina armada en la app. Pasá por el salón y el profe te arma una a tu medida.", cuenta);
                } else {
                    long semanas = ReglasRutina.semanas(actual.inicio(), hoy);
                    if (semanas >= reglas.semanasMax()) {
                        tarea(s, "RUTINA_VIEJA", 30, "¡Hola " + nombre + "! Hace " + semanas + " semanas que hacés la misma rutina: es un buen momento para renovarla y seguir progresando. ¿Cuándo venís así la armamos?", cuenta);
                    }
                }
            }

            // La membresía por vencer la avisa RecordatorioCuotaService (app y mail, configurable)
        }

        // ── Bajas: recupero a los 30, 60 y 90 días ──
        for (BajaSocio b : bajaRepo.findAllConSocio()) {
            Socio s = b.getSocio();
            if (s == null || Boolean.TRUE.equals(s.getActivo())) continue;   // eliminado o ya volvió
            long dias30 = ChronoUnit.DAYS.between(b.getFecha().toLocalDate(), hoy);
            for (int d : new int[]{30, 60, 90}) {
                if (dias30 >= d && dias30 <= d + 4) {
                    String tipo = "RECUPERO_" + d;
                    if (!accionRepo.existsBySocioIdAndTipoAndCreadaAfter(s.getId(), tipo, b.getFecha())) {
                        nuevaTarea(s, tipo, mensajeRecupero(s.getNombre(), b.getMotivo(), d));
                        cuenta[1]++;
                    }
                }
            }
        }
        return new Generadas(cuenta[0], cuenta[1]);
    }

    /** Promedio de días entre visitas en los últimos 60 días (mínimo 2) */
    static double frecuenciaHabitual(SortedSet<LocalDate> vino, LocalDate hoy) {
        List<LocalDate> recientes = vino.stream().filter(d -> !d.isBefore(hoy.minusDays(60))).toList();
        if (recientes.size() < 2) return 7;
        long total = ChronoUnit.DAYS.between(recientes.get(0), recientes.get(recientes.size() - 1));
        return Math.max(2, (double) total / (recientes.size() - 1));
    }

    static String mensajeRecupero(String nombre, String motivo, int dias) {
        String base = "¡Hola " + nombre + "! ";
        String cuerpo = switch (motivo == null ? "" : motivo) {
            case "PRECIO" -> "Tenemos planes nuevos que quizás te sirvan más. ¿Te contamos?";
            case "HORARIOS" -> "Sumamos horarios y clases nuevas. ¿Querés que te pasemos los que te quedan bien?";
            case "FALTA_TIEMPO" -> "Armamos rutinas cortas de 40 minutos para los días con poco tiempo. ¿Te animás a volver?";
            case "SALUD" -> "¿Cómo seguís? Cuando estés listo/a, armamos una rutina suave para volver de a poco.";
            case "SIN_RESULTADOS" -> "Nos gustaría armarte un plan nuevo, con objetivos claros y seguimiento. ¿Te sumás?";
            case "MUDANZA" -> "Si algún día pasás por la zona, tenés las puertas abiertas.";
            default -> "Te extrañamos en el gimnasio. Si querés volver, te esperamos con una rutina nueva.";
        };
        return base + cuerpo + (dias >= 60 ? " Si volvés este mes, la primera semana va por nuestra cuenta." : "");
    }

    // ── Tareas para el staff ─────────────────────────────────────────────────

    public record Tarea(Long id, Long socioId, String socioNombre, String telefono, String tipo, String titulo,
                        String mensaje, LocalDateTime creada) {}

    @Transactional(readOnly = true)
    public List<Tarea> pendientes() {
        return accionRepo.pendientes().stream().map(a -> new Tarea(a.getId(), a.getSocio().getId(),
                a.getSocio().getNombre() + " " + a.getSocio().getApellido(), a.getSocio().getTelefono(), a.getTipo(),
                TITULOS.getOrDefault(a.getTipo(), a.getTipo()), a.getMensaje(), a.getCreada())).toList();
    }

    @Transactional
    public void resolver(Long id, String estado, String usuario) {
        if (!AccionRetencion.HECHA.equals(estado) && !AccionRetencion.DESCARTADA.equals(estado)) {
            throw new IllegalArgumentException("Estado inválido");
        }
        AccionRetencion a = accionRepo.findById(id).orElseThrow(() -> new IllegalArgumentException("Tarea no encontrada"));
        a.setEstado(estado);
        a.setResuelta(LocalDateTime.now());
        a.setResueltaPor(usuario);
    }

    public record Resumen(int avisosApp, int tareasHechas, int tareasPendientes, int volvieron) {}

    /** Últimos 30 días: cuánto se hizo y cuántos de los contactados volvieron a entrenar */
    @Transactional(readOnly = true)
    public Resumen resumen() {
        LocalDate hoy = LocalDate.now();
        List<AccionRetencion> lista = accionRepo.desde(hoy.minusDays(30).atStartOfDay());
        int avisos = (int) lista.stream().filter(a -> AccionRetencion.AUTOMATICA.equals(a.getEstado())).count();
        int hechas = (int) lista.stream().filter(a -> AccionRetencion.HECHA.equals(a.getEstado())).count();
        int pend = (int) lista.stream().filter(a -> AccionRetencion.PENDIENTE.equals(a.getEstado())).count();
        Set<Long> contactados = new HashSet<>();
        Map<Long, LocalDate> desde = new HashMap<>();
        for (AccionRetencion a : lista) {
            if (AccionRetencion.PENDIENTE.equals(a.getEstado()) || AccionRetencion.DESCARTADA.equals(a.getEstado())) continue;
            contactados.add(a.getSocio().getId());
            desde.merge(a.getSocio().getId(), a.getCreada().toLocalDate(), (x, y) -> x.isBefore(y) ? x : y);
        }
        int volvieron = 0;
        for (Long sid : contactados) {
            LocalDate d = desde.get(sid);
            boolean vino = asistenciaRepo.findBySocioIdOrderByFechaDescHoraDesc(sid).stream()
                    .anyMatch(a -> Boolean.TRUE.equals(a.getPermitido()) && "ENTRADA".equals(a.getTipo()) && a.getFecha().isAfter(d));
            if (vino) volvieron++;
        }
        return new Resumen(avisos, hechas, pend, volvieron);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private void aviso(Socio s, String tipo, int diasSinRepetir, String titulo, String mensaje, int[] cuenta) {
        if (accionRepo.existsBySocioIdAndTipoAndCreadaAfter(s.getId(), tipo, LocalDateTime.now().minusDays(diasSinRepetir))) return;
        Notificacion n = new Notificacion();
        n.setTitulo(titulo);
        n.setMensaje(mensaje);
        n.setTipo("RETENCION");
        n.setDestinatario("SOCIO");
        n.setSocio(s);
        notificacionRepo.save(n);
        AccionRetencion a = new AccionRetencion();
        a.setSocio(s);
        a.setTipo(tipo);
        a.setEstado(AccionRetencion.AUTOMATICA);
        a.setMensaje(titulo + " — " + mensaje);
        accionRepo.save(a);
        cuenta[0]++;
    }

    private void tarea(Socio s, String tipo, int diasSinRepetir, String mensaje, int[] cuenta) {
        if (accionRepo.existsBySocioIdAndTipoAndCreadaAfter(s.getId(), tipo, LocalDateTime.now().minusDays(diasSinRepetir))) return;
        nuevaTarea(s, tipo, mensaje);
        cuenta[1]++;
    }

    private void nuevaTarea(Socio s, String tipo, String mensaje) {
        AccionRetencion a = new AccionRetencion();
        a.setSocio(s);
        a.setTipo(tipo);
        a.setEstado(AccionRetencion.PENDIENTE);
        a.setMensaje(mensaje);
        accionRepo.save(a);
    }
}
