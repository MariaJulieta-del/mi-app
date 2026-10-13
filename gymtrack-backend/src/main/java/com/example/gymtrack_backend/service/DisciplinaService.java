package com.example.gymtrack_backend.service;

import com.example.gymtrack_backend.dto.DisciplinaRequestDTO;
import com.example.gymtrack_backend.dto.DisciplinaRequestDTO.HorarioDTO;
import com.example.gymtrack_backend.dto.DisciplinaResponseDTO;
import com.example.gymtrack_backend.entities.Disciplina;
import com.example.gymtrack_backend.entities.InscripcionDisciplina;
import com.example.gymtrack_backend.entities.Socio;
import com.example.gymtrack_backend.entities.Usuario;
import com.example.gymtrack_backend.entities.enums.Rol;
import com.example.gymtrack_backend.repository.DisciplinaRepository;
import com.example.gymtrack_backend.repository.InscripcionDisciplinaRepository;
import com.example.gymtrack_backend.repository.MembresiaRepository;
import com.example.gymtrack_backend.repository.SocioRepository;
import com.example.gymtrack_backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.*;

/**
 * Disciplinas (clases grupales): horarios por día, cupo, instructor y socios inscriptos.
 * Un socio puede estar en varias disciplinas; para inscribirse necesita la membresía vigente.
 */
@Service
@RequiredArgsConstructor
public class DisciplinaService {

    public static final List<String> DIAS = List.of("LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO", "DOMINGO");

    private final DisciplinaRepository repo;
    private final InscripcionDisciplinaRepository inscripcionRepo;
    private final SocioRepository socioRepo;
    private final UsuarioRepository usuarioRepo;
    private final MembresiaRepository membresiaRepo;
    private final MembresiaService membresiaService;
    private final com.example.gymtrack_backend.repository.AsistenciaRepository asistenciaRepo;
    /** Para pasar a confirmados a los que esperaban cuando se libera un lugar */
    @org.springframework.beans.factory.annotation.Autowired
    @org.springframework.context.annotation.Lazy
    private ReservaService reservas;

    // ── Consultas ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<DisciplinaResponseDTO> listar(boolean soloActivas, boolean conInscriptos, Long socioIdConsulta, String usuarioActual) {
        List<Disciplina> lista = soloActivas ? repo.findByActivaTrue() : repo.findAll();
        Set<Long> delSocio = socioIdConsulta == null ? Set.of() : new HashSet<>(
                inscripcionRepo.findConDisciplinaBySocioId(socioIdConsulta).stream().map(i -> i.getDisciplina().getId()).toList());
        return lista.stream()
                .sorted(Comparator.comparing((Disciplina d) -> !Boolean.TRUE.equals(d.getActiva()))
                        .thenComparing(d -> d.getNombre().toLowerCase()))
                .map(d -> {
                    DisciplinaResponseDTO dto = toDTO(d, conInscriptos);
                    if (socioIdConsulta != null) dto.setInscripto(delSocio.contains(d.getId()));
                    if (usuarioActual != null) dto.setEsMia(d.getProfesor() != null && usuarioActual.equals(d.getProfesor().getUsername()));
                    return dto;
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public DisciplinaResponseDTO detalle(Long id) {
        return toDTO(obtener(id), true);
    }

    /** Disciplinas en las que está inscripto un socio */
    @Transactional(readOnly = true)
    public List<DisciplinaResponseDTO> delSocio(Long socioId) {
        return inscripcionRepo.findConDisciplinaBySocioId(socioId).stream()
                .map(i -> toDTO(i.getDisciplina(), false))
                .sorted(Comparator.comparing(DisciplinaResponseDTO::getNombre, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    public record ClaseHoy(Long disciplinaId, String nombre, Integer color, String horaInicio, String horaFin,
                           String instructor, int inscriptos, Integer cupoMaximo) {}

    /** Clases de hoy (para la pantalla "Hoy" del profesor), ordenadas por hora */
    @Transactional(readOnly = true)
    public List<ClaseHoy> clasesDeHoy() {
        String hoy = DIAS.get(LocalDate.now().getDayOfWeek().getValue() - 1);
        List<ClaseHoy> clases = new ArrayList<>();
        for (Disciplina d : repo.findByActivaTrue()) {
            for (Disciplina.Horario h : d.getHorarios()) {
                if (!hoy.equals(h.getDia())) continue;
                clases.add(new ClaseHoy(d.getId(), d.getNombre(), d.getColor(), h.getHoraInicio(), h.getHoraFin(),
                        nombreInstructor(d), (int) inscripcionRepo.contarActivos(d.getId()), d.getCupoMaximo()));
            }
        }
        clases.sort(Comparator.comparing(ClaseHoy::horaInicio));
        return clases;
    }

    public record Instructor(Long id, String nombre) {}

    /** Profesores activos para elegir como instructor */
    @Transactional(readOnly = true)
    public List<Instructor> instructores() {
        return usuarioRepo.findByRol(Rol.PROFESOR).stream()
                .filter(Usuario::isEnabled)
                .map(u -> new Instructor(u.getId(), nombreDe(u)))
                .sorted(Comparator.comparing(Instructor::nombre, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    // ── Asistencia a las clases ──────────────────────────────────────────────

    /** Se cuenta como presente a quien ingresó al gimnasio desde este tiempo antes del inicio hasta el fin */
    public static final int MINUTOS_ANTES = 90;

    public record Presente(Long socioId, String nombre, String hora) {}
    public record Sesion(LocalDate fecha, String dia, String horaInicio, String horaFin, String estado,
                         List<Presente> presentes, int esperados) {}
    public record ResumenAlumno(Long socioId, String nombre, int asistencias, int sesiones, LocalDate ultimaVez) {}
    public record AsistenciaClase(List<Sesion> sesiones, List<ResumenAlumno> alumnos, int minutosAntes, int semanas) {}

    /**
     * Quién vino a cada clase de las últimas semanas. Se deduce del ingreso al gimnasio
     * (QR o recepción) dentro del horario de la clase.
     */
    @Transactional(readOnly = true)
    public AsistenciaClase asistencia(Long disciplinaId, int semanas) {
        Disciplina d = obtener(disciplinaId);
        int sem = Math.max(1, Math.min(semanas, 12));
        LocalDate hoy = LocalDate.now();
        LocalDate desde = hoy.minusDays(sem * 7L - 1);
        java.time.LocalTime ahora = java.time.LocalTime.now();

        List<InscripcionDisciplina> inscripciones = inscripcionRepo.findConSocioByDisciplinaId(disciplinaId);
        Map<Long, InscripcionDisciplina> porSocio = new HashMap<>();
        inscripciones.forEach(i -> porSocio.put(i.getSocio().getId(), i));

        // Ingresos permitidos de los inscriptos: socio → fecha → horas
        Map<Long, Map<LocalDate, List<LocalTime>>> ingresos = new HashMap<>();
        for (var a : asistenciaRepo.findByFechaBetweenOrderByFechaDescHoraDesc(desde, hoy)) {
            if (!Boolean.TRUE.equals(a.getPermitido()) || !"ENTRADA".equals(a.getTipo()) || a.getHora() == null) continue;
            Long sid = a.getSocio().getId();
            if (!porSocio.containsKey(sid)) continue;
            ingresos.computeIfAbsent(sid, k -> new HashMap<>()).computeIfAbsent(a.getFecha(), k -> new ArrayList<>()).add(a.getHora());
        }

        List<Sesion> sesiones = new ArrayList<>();
        Map<Long, int[]> conteo = new HashMap<>();          // socio → {asistencias, sesiones}
        Map<Long, LocalDate> ultima = new HashMap<>();
        for (LocalDate f = hoy; !f.isBefore(desde); f = f.minusDays(1)) {
            String dia = DIAS.get(f.getDayOfWeek().getValue() - 1);
            List<Disciplina.Horario> delDia = d.getHorarios().stream().filter(h -> h.getDia().equals(dia))
                    .sorted(Comparator.comparing(Disciplina.Horario::getHoraInicio).reversed()).toList();
            for (Disciplina.Horario h : delDia) {
                LocalTime ini = hora(h.getHoraInicio()), fin = hora(h.getHoraFin());
                String estado = !f.equals(hoy) ? "PASADA" : ahora.isBefore(ini) ? "PROXIMA" : ahora.isBefore(fin) ? "EN_CURSO" : "PASADA";
                List<Presente> presentes = new ArrayList<>();
                int esperados = 0;
                for (InscripcionDisciplina i : inscripciones) {
                    Socio s = i.getSocio();
                    if (!Boolean.TRUE.equals(s.getActivo()) || i.getFechaAlta().isAfter(f)) continue;
                    esperados++;
                    if ("PROXIMA".equals(estado)) continue;
                    conteo.computeIfAbsent(s.getId(), k -> new int[2])[1]++;
                    LocalTime entrada = ingresos.getOrDefault(s.getId(), Map.of()).getOrDefault(f, List.of()).stream()
                            .filter(t -> !t.isBefore(desdeAntes(ini)) && t.isBefore(fin))
                            .min(Comparator.naturalOrder()).orElse(null);
                    if (entrada != null) {
                        presentes.add(new Presente(s.getId(), s.getNombre() + " " + s.getApellido(), entrada.toString().substring(0, 5)));
                        conteo.get(s.getId())[0]++;
                        ultima.merge(s.getId(), f, (x, y) -> x.isAfter(y) ? x : y);
                    }
                }
                presentes.sort(Comparator.comparing(Presente::nombre, String.CASE_INSENSITIVE_ORDER));
                sesiones.add(new Sesion(f, dia, h.getHoraInicio(), h.getHoraFin(), estado, presentes, esperados));
            }
        }

        List<ResumenAlumno> alumnos = inscripciones.stream()
                .filter(i -> Boolean.TRUE.equals(i.getSocio().getActivo()))
                .map(i -> {
                    int[] c = conteo.getOrDefault(i.getSocio().getId(), new int[2]);
                    return new ResumenAlumno(i.getSocio().getId(), i.getSocio().getNombre() + " " + i.getSocio().getApellido(),
                            c[0], c[1], ultima.get(i.getSocio().getId()));
                })
                // Primero los que menos vienen: son a quienes conviene escribirles
                .sorted(Comparator.comparingDouble((ResumenAlumno r) -> r.sesiones() == 0 ? 1 : (double) r.asistencias() / r.sesiones())
                        .thenComparing(ResumenAlumno::nombre, String.CASE_INSENSITIVE_ORDER))
                .toList();
        return new AsistenciaClase(sesiones, alumnos, MINUTOS_ANTES, sem);
    }

    /**
     * Desde cuándo un ingreso cuenta para la clase: MINUTOS_ANTES antes del inicio.
     * Si la clase empieza cerca de la medianoche no se "da la vuelta" al día anterior.
     */
    static LocalTime desdeAntes(LocalTime inicio) {
        LocalTime desde = inicio.minusMinutes(MINUTOS_ANTES);
        return desde.isAfter(inicio) ? LocalTime.MIN : desde;
    }

    // ── Alta / edición ───────────────────────────────────────────────────────

    @Transactional
    public DisciplinaResponseDTO crear(DisciplinaRequestDTO dto) {
        Disciplina d = new Disciplina();
        mapear(dto, d);
        return toDTO(repo.save(d), true);
    }

    @Transactional
    public DisciplinaResponseDTO actualizar(Long id, DisciplinaRequestDTO dto) {
        Disciplina d = obtener(id);
        if (dto.getCupoMaximo() != null) {
            long ocupados = inscripcionRepo.contarActivos(id);
            if (dto.getCupoMaximo() < ocupados) {
                throw new IllegalArgumentException("Hay " + ocupados + " socios inscriptos: el cupo no puede ser menor. "
                        + "Primero quitá socios o liberá los cupos de quienes no tienen la membresía vigente.");
            }
        }
        mapear(dto, d);
        DisciplinaResponseDTO res = toDTO(repo.save(d), true);
        reservas.promoverProximas(id);   // si subió el cupo, entran los que esperaban
        return res;
    }

    @Transactional
    public void cambiarActiva(Long id, boolean activa) {
        Disciplina d = obtener(id);
        d.setActiva(activa);
        repo.save(d);
    }

    // ── Inscripciones ────────────────────────────────────────────────────────

    @Transactional
    public DisciplinaResponseDTO inscribir(Long disciplinaId, Long socioId) {
        Disciplina d = obtener(disciplinaId);
        if (!Boolean.TRUE.equals(d.getActiva())) throw new IllegalArgumentException("La disciplina está inactiva");
        Socio s = socioRepo.findById(socioId).orElseThrow(() -> new IllegalArgumentException("Socio no encontrado"));
        if (!Boolean.TRUE.equals(s.getActivo())) throw new IllegalArgumentException("El socio está dado de baja");
        if (inscripcionRepo.existsByDisciplinaIdAndSocioId(disciplinaId, socioId)) {
            throw new IllegalArgumentException(s.getNombre() + " ya está inscripto en " + d.getNombre());
        }
        if (!membresiaVigente(socioId)) {
            throw new IllegalArgumentException(s.getNombre() + " no tiene la membresía vigente. Cobrale un plan para inscribirlo.");
        }
        if (d.getCupoMaximo() != null) {
            long ocupados = inscripcionRepo.contarActivos(disciplinaId);
            if (ocupados >= d.getCupoMaximo()) {
                throw new IllegalArgumentException(d.getNombre() + " está completa (" + ocupados + "/" + d.getCupoMaximo() + ")");
            }
        }
        InscripcionDisciplina i = new InscripcionDisciplina();
        i.setDisciplina(d);
        i.setSocio(s);
        inscripcionRepo.save(i);
        com.example.gymtrack_backend.auditoria.AuditoriaInterceptor.socio(socioId);
        com.example.gymtrack_backend.auditoria.AuditoriaInterceptor.detalle(d.getNombre());
        DisciplinaResponseDTO dto = toDTO(d, true);
        dto.setAviso(avisoPases(socioId));
        return dto;
    }

    /**
     * Las clases fijas no gastan pases por anotarse: se gasta uno por cada día que entra al gimnasio.
     * Si entre todas sus clases fijas va más días por mes que los pases del plan, se avisa.
     */
    String avisoPases(Long socioId) {
        Integer pases = membresiaRepo.findBySocioId(socioId).map(com.example.gymtrack_backend.entities.Membresia::getPasesMensuales).orElse(null);
        if (pases == null || pases <= 0) return null;
        long diasPorSemana = inscripcionRepo.findConDisciplinaBySocioId(socioId).stream()
                .flatMap(i -> i.getDisciplina().getHorarios().stream().map(Disciplina.Horario::getDia))
                .distinct().count();
        int porMes = (int) Math.round(diasPorSemana * 4.3);
        if (porMes <= pases) return null;
        return "Con sus clases fijas viene unos " + porMes + " días por mes y su plan tiene " + pases
                + " pases: se le van a terminar antes de fin de mes.";
    }

    @Transactional
    public DisciplinaResponseDTO desinscribir(Long disciplinaId, Long socioId) {
        Disciplina d = obtener(disciplinaId);
        inscripcionRepo.findByDisciplinaIdAndSocioId(disciplinaId, socioId).ifPresent(inscripcionRepo::delete);
        com.example.gymtrack_backend.auditoria.AuditoriaInterceptor.detalle(d.getNombre());
        reservas.promoverProximas(disciplinaId);   // su lugar fijo pasa a la espera
        return toDTO(d, true);
    }

    /**
     * Libera los cupos de quienes ya no pueden asistir (dados de baja o sin membresía vigente).
     * Reemplaza al viejo "Renovar mes", que sacaba a todos.
     */
    @Transactional
    public int liberarCupos(Long disciplinaId) {
        Disciplina d = obtener(disciplinaId);
        int liberados = 0;
        for (InscripcionDisciplina i : inscripcionRepo.findConSocioByDisciplinaId(disciplinaId)) {
            Socio s = i.getSocio();
            if (!Boolean.TRUE.equals(s.getActivo()) || !membresiaVigente(s.getId())) {
                inscripcionRepo.delete(i);
                liberados++;
            }
        }
        com.example.gymtrack_backend.auditoria.AuditoriaInterceptor.detalle(d.getNombre() + ": " + liberados + " cupos liberados");
        if (liberados > 0) reservas.promoverProximas(disciplinaId);
        return liberados;
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    public Disciplina obtener(Long id) {
        return repo.findById(id).orElseThrow(() -> new IllegalArgumentException("Disciplina no encontrada"));
    }

    private boolean membresiaVigente(Long socioId) {
        return membresiaRepo.findBySocioId(socioId)
                .map(m -> membresiaService.estaVigente(m, LocalDate.now()))
                .orElse(false);
    }

    private void mapear(DisciplinaRequestDTO dto, Disciplina d) {
        String nombre = dto.getNombre() == null ? "" : dto.getNombre().trim();
        if (nombre.isEmpty()) throw new IllegalArgumentException("El nombre es obligatorio");
        if (dto.getCupoMaximo() != null && dto.getCupoMaximo() < 1) throw new IllegalArgumentException("El cupo tiene que ser 1 o más (o dejalo vacío para sin límite)");
        if (dto.getColor() != null && (dto.getColor() < 1 || dto.getColor() > 8)) throw new IllegalArgumentException("Color inválido");

        Usuario profesor = null;
        if (dto.getProfesorId() != null) {
            profesor = usuarioRepo.findById(dto.getProfesorId())
                    .filter(u -> u.getRol() == Rol.PROFESOR || u.getRol() == Rol.ADMIN)
                    .orElseThrow(() -> new IllegalArgumentException("El instructor elegido no es un profesor"));
        }

        List<Disciplina.Horario> horarios = validarHorarios(dto.getHorarios());
        if (profesor != null) validarSuperposicion(profesor, horarios, d.getId());

        d.setNombre(nombre);
        d.setDescripcion(blancoANull(dto.getDescripcion()));
        d.setProfesor(profesor);
        // Solo profesores registrados: el nombre escrito a mano (versiones viejas) se descarta al guardar
        d.setInstructor(null);
        d.setCupoMaximo(dto.getCupoMaximo());
        d.setColor(dto.getColor() != null ? dto.getColor() : siguienteColor());
        if (dto.getActiva() != null) d.setActiva(dto.getActiva());
        d.getHorarios().clear();
        d.getHorarios().addAll(horarios);
    }

    private List<Disciplina.Horario> validarHorarios(List<HorarioDTO> entrada) {
        List<Disciplina.Horario> salida = new ArrayList<>();
        for (HorarioDTO h : entrada == null ? List.<HorarioDTO>of() : entrada) {
            String dia = h.getDia() == null ? "" : h.getDia().trim().toUpperCase();
            if (!DIAS.contains(dia)) throw new IllegalArgumentException("Día inválido: " + h.getDia());
            LocalTime ini = hora(h.getHoraInicio()), fin = hora(h.getHoraFin());
            if (!fin.isAfter(ini)) throw new IllegalArgumentException("En " + capital(dia) + " la hora de fin tiene que ser posterior a la de inicio");
            for (Disciplina.Horario otro : salida) {
                if (otro.getDia().equals(dia) && seSuperponen(ini, fin, hora(otro.getHoraInicio()), hora(otro.getHoraFin()))) {
                    throw new IllegalArgumentException("Hay dos horarios superpuestos el " + capital(dia));
                }
            }
            Disciplina.Horario x = new Disciplina.Horario();
            x.setDia(dia);
            x.setHoraInicio(ini.toString());
            x.setHoraFin(fin.toString());
            salida.add(x);
        }
        salida.sort(Comparator.comparing((Disciplina.Horario x) -> DIAS.indexOf(x.getDia())).thenComparing(Disciplina.Horario::getHoraInicio));
        return salida;
    }

    /** Un profesor no puede dar dos clases a la misma hora */
    private void validarSuperposicion(Usuario profesor, List<Disciplina.Horario> horarios, Long idActual) {
        for (Disciplina otra : repo.findByActivaTrue()) {
            if (otra.getId().equals(idActual) || otra.getProfesor() == null || !otra.getProfesor().getId().equals(profesor.getId())) continue;
            for (Disciplina.Horario a : horarios) {
                for (Disciplina.Horario b : otra.getHorarios()) {
                    if (a.getDia().equals(b.getDia()) && seSuperponen(hora(a.getHoraInicio()), hora(a.getHoraFin()), hora(b.getHoraInicio()), hora(b.getHoraFin()))) {
                        throw new IllegalArgumentException(nombreDe(profesor) + " ya da " + otra.getNombre() + " el "
                                + capital(a.getDia()) + " de " + b.getHoraInicio() + " a " + b.getHoraFin());
                    }
                }
            }
        }
    }

    private static boolean seSuperponen(LocalTime ini1, LocalTime fin1, LocalTime ini2, LocalTime fin2) {
        return ini1.isBefore(fin2) && ini2.isBefore(fin1);
    }

    private static LocalTime hora(String s) {
        try { return LocalTime.parse(s == null ? "" : s.trim().length() == 4 ? "0" + s.trim() : s.trim()); }
        catch (DateTimeParseException e) { throw new IllegalArgumentException("Hora inválida: " + s); }
    }

    /** Primer color de la paleta que no esté en uso (o el siguiente en orden) */
    private int siguienteColor() {
        Set<Integer> usados = new HashSet<>();
        repo.findByActivaTrue().forEach(x -> { if (x.getColor() != null) usados.add(x.getColor()); });
        for (int c = 1; c <= 8; c++) if (!usados.contains(c)) return c;
        return (int) (repo.count() % 8) + 1;
    }

    private DisciplinaResponseDTO toDTO(Disciplina d, boolean conInscriptos) {
        DisciplinaResponseDTO dto = new DisciplinaResponseDTO();
        dto.setId(d.getId());
        dto.setNombre(d.getNombre());
        dto.setDescripcion(d.getDescripcion());
        dto.setInstructor(nombreInstructor(d));
        dto.setProfesorId(d.getProfesor() != null ? d.getProfesor().getId() : null);
        dto.setCupoMaximo(d.getCupoMaximo());
        dto.setColor(d.getColor());
        dto.setActiva(d.getActiva());
        dto.setHorarios(d.getHorarios().stream()
                .sorted(Comparator.comparing((Disciplina.Horario x) -> DIAS.indexOf(x.getDia())).thenComparing(Disciplina.Horario::getHoraInicio))
                .map(h -> { HorarioDTO x = new HorarioDTO(); x.setDia(h.getDia()); x.setHoraInicio(h.getHoraInicio()); x.setHoraFin(h.getHoraFin()); return x; })
                .toList());
        long ocupados = inscripcionRepo.contarActivos(d.getId());
        dto.setTotalInscritos((int) ocupados);
        dto.setCuposDisponibles(d.getCupoMaximo() != null ? (int) Math.max(0, d.getCupoMaximo() - ocupados) : null);
        if (conInscriptos) {
            dto.setInscriptos(inscripcionRepo.findConSocioByDisciplinaId(d.getId()).stream().map(i -> {
                DisciplinaResponseDTO.Inscripto x = new DisciplinaResponseDTO.Inscripto();
                Socio s = i.getSocio();
                x.setSocioId(s.getId());
                x.setNombre(s.getNombre() + " " + s.getApellido());
                x.setActivo(Boolean.TRUE.equals(s.getActivo()));
                x.setMembresiaVigente(membresiaVigente(s.getId()));
                x.setFechaAlta(i.getFechaAlta());
                return x;
            }).toList());
        }
        return dto;
    }

    /** Nombre del profesor asignado (los nombres escritos a mano de versiones viejas no se muestran) */
    static String nombreInstructor(Disciplina d) {
        return d.getProfesor() != null ? nombreDe(d.getProfesor()) : null;
    }

    private static String nombreDe(Usuario u) {
        String n = ((u.getNombre() == null ? "" : u.getNombre()) + " " + (u.getApellido() == null ? "" : u.getApellido())).trim();
        return n.isEmpty() ? u.getUsername() : n;
    }

    private static String blancoANull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private static String capital(String dia) {
        return dia.charAt(0) + dia.substring(1).toLowerCase();
    }
}
