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
import java.time.LocalTime;
import java.util.*;

/**
 * Reservas de clases puntuales (disciplina + fecha + horario).
 *
 *  - Los alumnos fijos (inscriptos) tienen su lugar todas las semanas. Si un día no van, lo "liberan".
 *  - Cualquier socio con membresía vigente puede reservar un lugar libre; si la clase está llena queda en espera.
 *  - Cuando alguien cancela o libera, el primero de la espera pasa a confirmado y se le avisa.
 *  - Si reservó y no vino, se le cuenta como un pase usado (ver MembresiaService.calcularPases).
 */
@Service
@RequiredArgsConstructor
public class ReservaService {

    /** Se puede reservar hasta esta cantidad de días para adelante */
    public static final int DIAS_ADELANTE = 7;

    private static final Logger log = LoggerFactory.getLogger(ReservaService.class);

    private final DisciplinaRepository disciplinaRepo;
    private final InscripcionDisciplinaRepository inscripcionRepo;
    private final ReservaClaseRepository reservaRepo;
    private final SocioRepository socioRepo;
    private final MembresiaRepository membresiaRepo;
    private final MembresiaService membresiaService;
    private final AsistenciaRepository asistenciaRepo;
    private final NotificacionRepository notificacionRepo;

    public record ClaseAgenda(Long disciplinaId, String nombre, Integer color, String descripcion, String instructor,
                              LocalDate fecha, String dia, String horaInicio, String horaFin,
                              Integer cupo, int ocupados, Integer disponibles, int enEspera, String estadoClase,
                              boolean fijo, String miEstado, Integer miPosicion) {}

    // ── Agenda de la semana ─────────────────────────────────────────────────

    /** Clases de los próximos días con el lugar disponible y el estado del socio en cada una */
    @Transactional(readOnly = true)
    public List<ClaseAgenda> agenda(Long socioId) {
        LocalDate hoy = LocalDate.now();
        LocalDate hasta = hoy.plusDays(DIAS_ADELANTE - 1L);
        Set<Long> misFijas = new HashSet<>();
        if (socioId != null) inscripcionRepo.findConDisciplinaBySocioId(socioId).forEach(i -> misFijas.add(i.getDisciplina().getId()));

        Map<String, List<ReservaClase>> reservas = new HashMap<>();
        for (ReservaClase r : reservaRepo.entre(hoy, hasta)) {
            reservas.computeIfAbsent(clave(r.getDisciplina().getId(), r.getFecha(), r.getHoraInicio()), k -> new ArrayList<>()).add(r);
        }
        Map<Long, List<InscripcionDisciplina>> fijosPorDisciplina = new HashMap<>();

        List<ClaseAgenda> lista = new ArrayList<>();
        for (Disciplina d : disciplinaRepo.findByActivaTrue()) {
            List<InscripcionDisciplina> fijos = fijosPorDisciplina.computeIfAbsent(d.getId(), inscripcionRepo::findConSocioByDisciplinaId);
            for (LocalDate f = hoy; !f.isAfter(hasta); f = f.plusDays(1)) {
                String dia = DisciplinaService.DIAS.get(f.getDayOfWeek().getValue() - 1);
                for (Disciplina.Horario h : d.getHorarios()) {
                    if (!dia.equals(h.getDia())) continue;
                    String estadoClase = estadoClase(f, h);
                    if ("PASADA".equals(estadoClase)) continue;
                    List<ReservaClase> rs = reservas.getOrDefault(clave(d.getId(), f, h.getHoraInicio()), List.of());
                    Ocupacion o = ocupacion(d, f, fijos, rs);

                    boolean fijo = misFijas.contains(d.getId());
                    String miEstado = null;
                    Integer miPos = null;
                    if (socioId != null) {
                        ReservaClase mia = rs.stream().filter(r -> r.getSocio().getId().equals(socioId)).findFirst().orElse(null);
                        if (fijo) miEstado = mia != null && ReservaClase.LIBERADA.equals(mia.getEstado()) ? ReservaClase.LIBERADA : "FIJO";
                        else if (mia != null && !ReservaClase.CANCELADA.equals(mia.getEstado())) miEstado = mia.getEstado();
                        if (ReservaClase.ESPERA.equals(miEstado)) miPos = o.espera().indexOf(mia) + 1;
                    }
                    lista.add(new ClaseAgenda(d.getId(), d.getNombre(), d.getColor(), d.getDescripcion(),
                            DisciplinaService.nombreInstructor(d), f, dia, h.getHoraInicio(), h.getHoraFin(),
                            d.getCupoMaximo(), o.ocupados(), o.disponibles(), o.espera().size(), estadoClase,
                            fijo, miEstado, miPos));
                }
            }
        }
        lista.sort(Comparator.comparing(ClaseAgenda::fecha).thenComparing(ClaseAgenda::horaInicio));
        return lista;
    }

    // ── Reservar / cancelar ─────────────────────────────────────────────────

    public record Resultado(String estado, Integer posicion, String mensaje) {}

    @Transactional
    public Resultado reservar(Long socioId, Long disciplinaId, LocalDate fecha, String hora) {
        Disciplina d = disciplinaRepo.findById(disciplinaId).orElseThrow(() -> new IllegalArgumentException("Disciplina no encontrada"));
        Disciplina.Horario h = validarClase(d, fecha, hora);
        Socio s = socioRepo.findById(socioId).orElseThrow(() -> new IllegalArgumentException("Socio no encontrado"));
        if (!Boolean.TRUE.equals(s.getActivo())) throw new IllegalArgumentException("El socio está dado de baja");
        if (!membresiaVigente(socioId)) throw new IllegalArgumentException("Necesitás la membresía vigente para reservar. Renovala en recepción.");

        List<ReservaClase> rs = reservaRepo.deLaClase(disciplinaId, fecha, h.getHoraInicio());
        ReservaClase mia = rs.stream().filter(r -> r.getSocio().getId().equals(socioId)).findFirst().orElse(null);
        boolean fijo = inscripcionRepo.existsByDisciplinaIdAndSocioId(disciplinaId, socioId);
        if (fijo && (mia == null || !ReservaClase.LIBERADA.equals(mia.getEstado()))) {
            throw new IllegalArgumentException("Ya tenés tu lugar fijo en esta clase");
        }
        if (mia != null && (ReservaClase.CONFIRMADA.equals(mia.getEstado()) || ReservaClase.ESPERA.equals(mia.getEstado()))) {
            throw new IllegalArgumentException("Ya tenés esta clase reservada");
        }

        // Cuántos lugares quedan sin contar mi registro anterior (si lo había)
        // (un fijo que liberó su lugar se cuenta con su liberación: no se ocupa a sí mismo)
        List<ReservaClase> base = fijo ? rs : rs.stream().filter(r -> r != mia).toList();
        Ocupacion o = ocupacion(d, fecha, inscripcionRepo.findConSocioByDisciplinaId(disciplinaId), base);
        boolean hayLugar = o.disponibles() == null || o.disponibles() > 0;

        ReservaClase r = mia != null ? mia : new ReservaClase();
        r.setDisciplina(d);
        r.setSocio(s);
        r.setFecha(fecha);
        r.setHoraInicio(h.getHoraInicio());
        r.setCreada(LocalDateTime.now());   // vuelve al final de la espera
        r.setActualizada(LocalDateTime.now());
        if (fijo) {
            // Alumno fijo que había liberado su lugar y lo quiere de vuelta
            if (!hayLugar) throw new IllegalArgumentException("Tu lugar ya lo ocupó otra persona. Probá en otro horario.");
            reservaRepo.delete(r);
            return new Resultado("FIJO", null, "Recuperaste tu lugar en " + d.getNombre());
        }
        r.setEstado(hayLugar ? ReservaClase.CONFIRMADA : ReservaClase.ESPERA);
        reservaRepo.save(r);
        if (hayLugar) return new Resultado(ReservaClase.CONFIRMADA, null, "¡Listo! Tenés tu lugar en " + d.getNombre());
        int pos = o.espera().size() + 1;
        return new Resultado(ReservaClase.ESPERA, pos, "La clase está llena: quedaste " + pos + "° en la lista de espera. Si se libera un lugar te avisamos.");
    }

    @Transactional
    public Resultado cancelar(Long socioId, Long disciplinaId, LocalDate fecha, String hora) {
        Disciplina d = disciplinaRepo.findById(disciplinaId).orElseThrow(() -> new IllegalArgumentException("Disciplina no encontrada"));
        Disciplina.Horario h = validarClase(d, fecha, hora);
        Socio s = socioRepo.findById(socioId).orElseThrow(() -> new IllegalArgumentException("Socio no encontrado"));
        boolean fijo = inscripcionRepo.existsByDisciplinaIdAndSocioId(disciplinaId, socioId);
        ReservaClase mia = reservaRepo.findByDisciplinaIdAndSocioIdAndFechaAndHoraInicio(disciplinaId, socioId, fecha, h.getHoraInicio()).orElse(null);

        String mensaje;
        if (fijo) {
            if (mia != null && ReservaClase.LIBERADA.equals(mia.getEstado())) throw new IllegalArgumentException("Ya avisaste que no vas a esa clase");
            if (mia == null) { mia = new ReservaClase(); mia.setDisciplina(d); mia.setSocio(s); mia.setFecha(fecha); mia.setHoraInicio(h.getHoraInicio()); }
            mia.setEstado(ReservaClase.LIBERADA);
            mensaje = "Gracias por avisar: liberaste tu lugar para ese día";
        } else {
            if (mia == null || !(ReservaClase.CONFIRMADA.equals(mia.getEstado()) || ReservaClase.ESPERA.equals(mia.getEstado()))) {
                throw new IllegalArgumentException("No tenés reservada esa clase");
            }
            mia.setEstado(ReservaClase.CANCELADA);
            mensaje = "Cancelaste tu reserva";
        }
        mia.setActualizada(LocalDateTime.now());
        reservaRepo.save(mia);
        promover(d, fecha, h.getHoraInicio());
        return new Resultado(mia.getEstado(), null, mensaje);
    }

    /** Pasa a confirmados a los primeros de la espera mientras haya lugar, y les avisa en la app */
    private void promover(Disciplina d, LocalDate fecha, String hora) {
        List<ReservaClase> rs = reservaRepo.deLaClase(d.getId(), fecha, hora);
        Ocupacion o = ocupacion(d, fecha, inscripcionRepo.findConSocioByDisciplinaId(d.getId()), rs);
        int libres = o.disponibles() == null ? Integer.MAX_VALUE : o.disponibles();
        for (ReservaClase r : o.espera()) {
            if (libres <= 0) break;
            r.setEstado(ReservaClase.CONFIRMADA);
            r.setActualizada(LocalDateTime.now());
            reservaRepo.save(r);
            libres--;
            Notificacion n = new Notificacion();
            n.setTitulo("¡Se liberó un lugar!");
            n.setMensaje("Tenés lugar en " + d.getNombre() + " el " + diaYFecha(fecha) + " a las " + hora + ". Si no podés ir, cancelá la reserva así lo usa otro.");
            n.setTipo("RESERVA");
            n.setDestinatario("SOCIO");
            n.setSocio(r.getSocio());
            notificacionRepo.save(n);
        }
    }

    // ── Inscripción como alumno fijo, hecha por el propio socio ─────────────

    /** Para el staff: quién viene a una clase puntual */
    public record Asistente(Long socioId, String nombre, String tipo, Integer posicion) {}
    public record DetalleClase(Long disciplinaId, String nombre, LocalDate fecha, String horaInicio, Integer cupo,
                               int ocupados, List<Asistente> vienen, List<Asistente> espera, List<Asistente> avisaronQueNo) {}

    @Transactional(readOnly = true)
    public DetalleClase detalle(Long disciplinaId, LocalDate fecha, String hora) {
        Disciplina d = disciplinaRepo.findById(disciplinaId).orElseThrow(() -> new IllegalArgumentException("Disciplina no encontrada"));
        Disciplina.Horario h = horario(d, fecha, hora);
        List<ReservaClase> rs = reservaRepo.deLaClase(disciplinaId, fecha, h.getHoraInicio());
        List<InscripcionDisciplina> fijos = inscripcionRepo.findConSocioByDisciplinaId(disciplinaId);
        Ocupacion o = ocupacion(d, fecha, fijos, rs);
        Set<Long> liberaron = new HashSet<>();
        List<Asistente> avisaron = new ArrayList<>();
        rs.stream().filter(r -> ReservaClase.LIBERADA.equals(r.getEstado())).forEach(r -> {
            liberaron.add(r.getSocio().getId());
            avisaron.add(new Asistente(r.getSocio().getId(), nombre(r.getSocio()), "FIJO", null));
        });
        List<Asistente> vienen = new ArrayList<>();
        for (InscripcionDisciplina i : fijos) {
            if (!Boolean.TRUE.equals(i.getSocio().getActivo()) || i.getFechaAlta().isAfter(fecha) || liberaron.contains(i.getSocio().getId())) continue;
            vienen.add(new Asistente(i.getSocio().getId(), nombre(i.getSocio()), "FIJO", null));
        }
        rs.stream().filter(r -> ReservaClase.CONFIRMADA.equals(r.getEstado()) || ReservaClase.ASISTIO.equals(r.getEstado()) || ReservaClase.AUSENTE.equals(r.getEstado()))
                .forEach(r -> vienen.add(new Asistente(r.getSocio().getId(), nombre(r.getSocio()), r.getEstado(), null)));
        List<Asistente> espera = new ArrayList<>();
        for (int i = 0; i < o.espera().size(); i++) {
            ReservaClase r = o.espera().get(i);
            espera.add(new Asistente(r.getSocio().getId(), nombre(r.getSocio()), ReservaClase.ESPERA, i + 1));
        }
        return new DetalleClase(d.getId(), d.getNombre(), fecha, h.getHoraInicio(), d.getCupoMaximo(), o.ocupados(), vienen, espera, avisaron);
    }

    /** Reservas próximas de un socio (para su pantalla de inicio) */
    @Transactional(readOnly = true)
    public List<ClaseAgenda> misClases(Long socioId) {
        return agenda(socioId).stream()
                .filter(c -> "FIJO".equals(c.miEstado()) || ReservaClase.CONFIRMADA.equals(c.miEstado()) || ReservaClase.ESPERA.equals(c.miEstado()))
                .toList();
    }

    // ── Quién vino y quién no (cada media hora) ─────────────────────────────

    /**
     * Las reservas confirmadas de clases que ya terminaron pasan a ASISTIO (si ingresó al gimnasio
     * desde 90 minutos antes hasta el fin de la clase) o AUSENTE (cuenta como pase usado).
     */
    @Scheduled(cron = "0 */30 * * * *")
    @Transactional
    public int marcarAsistencia() {
        LocalDate hoy = LocalDate.now();
        LocalTime ahora = LocalTime.now();
        int marcadas = 0;
        for (ReservaClase r : reservaRepo.confirmadasHasta(hoy)) {
            Disciplina.Horario h = r.getDisciplina().getHorarios().stream()
                    .filter(x -> x.getHoraInicio().equals(r.getHoraInicio())
                            && x.getDia().equals(DisciplinaService.DIAS.get(r.getFecha().getDayOfWeek().getValue() - 1)))
                    .findFirst().orElse(null);
            LocalTime fin = h != null ? LocalTime.parse(h.getHoraFin()) : LocalTime.parse(r.getHoraInicio()).plusHours(1);
            if (r.getFecha().equals(hoy) && ahora.isBefore(fin)) continue;   // todavía no terminó
            LocalTime desde = DisciplinaService.desdeAntes(LocalTime.parse(r.getHoraInicio()));
            boolean vino = asistenciaRepo.findBySocioIdOrderByFechaDescHoraDesc(r.getSocio().getId()).stream()
                    .anyMatch(a -> a.getFecha().equals(r.getFecha()) && Boolean.TRUE.equals(a.getPermitido()) && "ENTRADA".equals(a.getTipo())
                            && a.getHora() != null && !a.getHora().isBefore(desde) && a.getHora().isBefore(fin));
            r.setEstado(vino ? ReservaClase.ASISTIO : ReservaClase.AUSENTE);
            r.setActualizada(LocalDateTime.now());
            marcadas++;
        }
        if (marcadas > 0) log.info("Reservas cerradas: {}", marcadas);
        return marcadas;
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private record Ocupacion(int ocupados, Integer disponibles, List<ReservaClase> espera) {}

    /** Lugares ocupados = fijos que no liberaron + reservas confirmadas */
    private Ocupacion ocupacion(Disciplina d, LocalDate fecha, List<InscripcionDisciplina> fijos, List<ReservaClase> rs) {
        Set<Long> liberaron = new HashSet<>();
        rs.stream().filter(r -> ReservaClase.LIBERADA.equals(r.getEstado())).forEach(r -> liberaron.add(r.getSocio().getId()));
        int ocupados = (int) fijos.stream().filter(i -> Boolean.TRUE.equals(i.getSocio().getActivo())
                && !i.getFechaAlta().isAfter(fecha) && !liberaron.contains(i.getSocio().getId())).count();
        ocupados += (int) rs.stream().filter(r -> ReservaClase.CONFIRMADA.equals(r.getEstado())
                || ReservaClase.ASISTIO.equals(r.getEstado()) || ReservaClase.AUSENTE.equals(r.getEstado())).count();
        List<ReservaClase> espera = rs.stream().filter(r -> ReservaClase.ESPERA.equals(r.getEstado()))
                .sorted(Comparator.comparing(ReservaClase::getCreada).thenComparing(ReservaClase::getId)).toList();
        Integer disponibles = d.getCupoMaximo() == null ? null : Math.max(0, d.getCupoMaximo() - ocupados);
        return new Ocupacion(ocupados, disponibles, espera);
    }

    private Disciplina.Horario horario(Disciplina d, LocalDate fecha, String hora) {
        if (fecha == null || hora == null) throw new IllegalArgumentException("Faltan la fecha o la hora de la clase");
        String dia = DisciplinaService.DIAS.get(fecha.getDayOfWeek().getValue() - 1);
        return d.getHorarios().stream().filter(h -> h.getDia().equals(dia) && h.getHoraInicio().equals(hora)).findFirst()
                .orElseThrow(() -> new IllegalArgumentException(d.getNombre() + " no tiene clase ese día a esa hora"));
    }

    /** La clase existe, está activa, es de los próximos días y todavía no empezó */
    private Disciplina.Horario validarClase(Disciplina d, LocalDate fecha, String hora) {
        if (!Boolean.TRUE.equals(d.getActiva())) throw new IllegalArgumentException("La disciplina no está activa");
        Disciplina.Horario h = horario(d, fecha, hora);
        LocalDate hoy = LocalDate.now();
        if (fecha.isBefore(hoy) || fecha.isAfter(hoy.plusDays(DIAS_ADELANTE - 1L))) {
            throw new IllegalArgumentException("Solo se puede reservar para los próximos " + DIAS_ADELANTE + " días");
        }
        if (!"PROXIMA".equals(estadoClase(fecha, h))) throw new IllegalArgumentException("La clase ya empezó");
        return h;
    }

    private static String estadoClase(LocalDate f, Disciplina.Horario h) {
        LocalDate hoy = LocalDate.now();
        if (f.isBefore(hoy)) return "PASADA";
        if (f.isAfter(hoy)) return "PROXIMA";
        LocalTime ahora = LocalTime.now();
        if (ahora.isBefore(LocalTime.parse(h.getHoraInicio()))) return "PROXIMA";
        return ahora.isBefore(LocalTime.parse(h.getHoraFin())) ? "EN_CURSO" : "PASADA";
    }

    private boolean membresiaVigente(Long socioId) {
        return membresiaRepo.findBySocioId(socioId).map(m -> membresiaService.estaVigente(m, LocalDate.now())).orElse(false);
    }

    private static String clave(Long disciplinaId, LocalDate fecha, String hora) {
        return disciplinaId + "|" + fecha + "|" + hora;
    }

    private static String nombre(Socio s) {
        return s.getNombre() + " " + s.getApellido();
    }

    private static String diaYFecha(LocalDate f) {
        String dia = DisciplinaService.DIAS.get(f.getDayOfWeek().getValue() - 1).toLowerCase();
        return dia + " " + f.getDayOfMonth() + "/" + f.getMonthValue();
    }
}
