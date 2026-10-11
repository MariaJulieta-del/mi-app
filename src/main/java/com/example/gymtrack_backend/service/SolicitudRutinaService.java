package com.example.gymtrack_backend.service;

import com.example.gymtrack_backend.entities.*;
import com.example.gymtrack_backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

/**
 * Pedidos de rutina personalizada.
 * El socio lo pide desde su app (uno abierto por vez); al staff le aparece como tarea pendiente
 * (Hoy, Rutinas › Pedidos y el contador del menú) hasta que le arma una rutina, que lo cierra solo,
 * o lo descarta con un motivo. El socio recibe un aviso en su app cuando se resuelve.
 */
@Service
@RequiredArgsConstructor
public class SolicitudRutinaService {

    public static final Set<String> OBJETIVOS = Set.of("FUERZA", "HIPERTROFIA", "RESISTENCIA", "PERDIDA_GRASA", "SALUD");
    /** Pedidos que puede hacer un socio por mes (evita que cancele y vuelva a pedir sin parar) */
    public static final int PEDIDOS_POR_MES = 4;

    private final SolicitudRutinaRepository repo;
    private final SocioRepository socioRepo;
    private final NotificacionRepository notificacionRepo;
    private final RutinaRepository rutinaRepo;

    public record Pedido(Long id, Long socioId, String socio, String telefono, String objetivo, Integer diasSemana, String mensaje,
                         String estado, LocalDateTime creada, String tomadaPor, LocalDateTime resuelta, String resueltaPor,
                         Long rutinaId, String rutinaNombre, String motivo, Long rutinaActualId, String rutinaActualNombre) {}

    // ── Socio ──

    @Transactional
    public Pedido pedir(Long socioId, String objetivo, Integer diasSemana, String mensaje) {
        Socio socio = socioRepo.findById(socioId).orElseThrow(() -> new IllegalArgumentException("Socio no encontrado"));
        if (!Boolean.TRUE.equals(socio.getActivo())) throw new IllegalStateException("Tu cuenta está dada de baja");
        if (repo.abiertaDe(socioId).isPresent()) throw new IllegalStateException("Ya tenés un pedido en curso: tu profe lo está viendo");
        if (repo.contarDesde(socioId, LocalDateTime.now().minusDays(30)) >= PEDIDOS_POR_MES) {
            throw new IllegalStateException("Ya hiciste " + PEDIDOS_POR_MES + " pedidos este mes. Hablalo con tu profe en el salón.");
        }
        String obj = objetivo == null || objetivo.isBlank() ? null : objetivo.trim().toUpperCase();
        if (obj != null && !OBJETIVOS.contains(obj)) throw new IllegalArgumentException("Objetivo inválido");
        if (diasSemana != null && (diasSemana < 1 || diasSemana > 7)) throw new IllegalArgumentException("Los días por semana van de 1 a 7");
        String msj = limpiar(mensaje);
        if (msj != null && msj.length() > 500) throw new IllegalArgumentException("El mensaje no puede superar los 500 caracteres");

        SolicitudRutina s = new SolicitudRutina();
        s.setSocio(socio);
        s.setObjetivo(obj);
        s.setDiasSemana(diasSemana);
        s.setMensaje(msj);
        s.setEstado(SolicitudRutina.PENDIENTE);
        s.setCreada(LocalDateTime.now());
        return dto(repo.save(s));
    }

    /** El pedido abierto del socio o, si no tiene, el último (para mostrarle cómo terminó) */
    @Transactional(readOnly = true)
    public Pedido delSocio(Long socioId) {
        return repo.abiertaDe(socioId).or(() -> repo.findFirstBySocioIdOrderByCreadaDesc(socioId)).map(this::dto).orElse(null);
    }

    @Transactional
    public void cancelar(Long socioId) {
        SolicitudRutina s = repo.abiertaDe(socioId).orElseThrow(() -> new IllegalStateException("No tenés ningún pedido en curso"));
        s.setEstado(SolicitudRutina.CANCELADA);
        s.setResuelta(LocalDateTime.now());
        s.setResueltaPor("socio");
    }

    // ── Staff ──

    @Transactional(readOnly = true)
    public List<Pedido> abiertos() {
        return repo.abiertas().stream().map(this::dto).toList();
    }

    @Transactional(readOnly = true)
    public List<Pedido> resueltosRecientes() {
        return repo.resueltasDesde(LocalDateTime.now().minusDays(14)).stream().map(this::dto).toList();
    }

    public long cantidadAbiertos() {
        return repo.contarAbiertas();
    }

    /** "Lo tomo yo": para que el resto del staff sepa que alguien lo está armando */
    @Transactional
    public Pedido tomar(Long id) {
        SolicitudRutina s = abierto(id);
        s.setEstado(SolicitudRutina.EN_CURSO);
        s.setTomadaPor(usuario());
        s.setTomada(LocalDateTime.now());
        return dto(s);
    }

    @Transactional
    public Pedido descartar(Long id, String motivo) {
        String m = limpiar(motivo);
        if (m == null || m.length() < 5) throw new IllegalArgumentException("Contale al socio por qué (al menos 5 letras)");
        if (m.length() > 300) throw new IllegalArgumentException("El motivo no puede superar los 300 caracteres");
        SolicitudRutina s = abierto(id);
        s.setEstado(SolicitudRutina.DESCARTADA);
        s.setMotivo(m);
        s.setResuelta(LocalDateTime.now());
        s.setResueltaPor(usuario());
        avisar(s.getSocio(), "Sobre tu pedido de rutina", m);
        return dto(s);
    }

    /** Cerrar a mano (por ejemplo, si se le renovó la rutina que ya tenía en lugar de crear una nueva) */
    @Transactional
    public Pedido marcarHecho(Long id) {
        SolicitudRutina s = abierto(id);
        s.setEstado(SolicitudRutina.HECHA);
        s.setResuelta(LocalDateTime.now());
        s.setResueltaPor(usuario());
        rutinaRepo.findBySocioId(s.getSocio().getId()).stream()
                .filter(r -> r.getFechaCreacion() != null)
                .max(java.util.Comparator.comparing(ReglasRutina::inicio))
                .ifPresent(r -> s.setRutinaId(r.getId()));
        avisar(s.getSocio(), "Tu rutina está lista 💪", "Tu profe ya te armó la rutina que pediste. Mirala en \"Rutina\".");
        return dto(s);
    }

    /** Lo llama RutinaService cuando el staff le crea o asigna una rutina al socio */
    @Transactional
    public void resolverConRutina(Rutina rutina) {
        repo.abiertaDe(rutina.getSocio().getId()).ifPresent(s -> {
            s.setEstado(SolicitudRutina.HECHA);
            s.setResuelta(LocalDateTime.now());
            s.setResueltaPor(usuario());
            s.setRutinaId(rutina.getId());
            avisar(s.getSocio(), "Tu rutina está lista 💪", "Tu profe te armó \"" + rutina.getNombre() + "\", la rutina que pediste. Mirala en \"Rutina\".");
        });
    }

    // ── Ayudantes ──

    private SolicitudRutina abierto(Long id) {
        SolicitudRutina s = repo.findById(id).orElseThrow(() -> new com.example.gymtrack_backend.web.RecursoNoEncontradoException("Pedido no encontrado"));
        if (!s.abierta()) throw new IllegalStateException("Ese pedido ya está cerrado");
        return s;
    }

    private void avisar(Socio socio, String titulo, String mensaje) {
        Notificacion n = new Notificacion();
        n.setTitulo(titulo);
        n.setMensaje(mensaje);
        n.setTipo("RUTINA");
        n.setDestinatario("SOCIO");
        n.setSocio(socio);
        n.setPorEmail(false);
        notificacionRepo.save(n);
    }

    private static String usuario() {
        var a = SecurityContextHolder.getContext().getAuthentication();
        String u = a == null ? "sistema" : a.getName();
        return u.length() > 50 ? u.substring(0, 50) : u;
    }

    /** Texto sin espacios de más ni caracteres de control */
    static String limpiar(String t) {
        if (t == null) return null;
        String s = t.replaceAll("[\\p{Cntrl}&&[^\\n]]", "").replaceAll("\\n{3,}", "\n\n").trim();
        return s.isEmpty() ? null : s;
    }

    private Pedido dto(SolicitudRutina s) {
        Socio so = s.getSocio();
        String nombreRutina = s.getRutinaId() == null ? null : rutinaRepo.findById(s.getRutinaId()).map(Rutina::getNombre).orElse(null);
        Rutina actual = rutinaRepo.findBySocioId(so.getId()).stream().filter(r -> ReglasRutina.inicio(r) != null)
                .max(java.util.Comparator.comparing(ReglasRutina::inicio)).orElse(null);
        return new Pedido(s.getId(), so.getId(), so.getNombre() + " " + so.getApellido(), so.getTelefono(), s.getObjetivo(), s.getDiasSemana(),
                s.getMensaje(), s.getEstado(), s.getCreada(), s.getTomadaPor(), s.getResuelta(), s.getResueltaPor(),
                s.getRutinaId(), nombreRutina, s.getMotivo(), actual == null ? null : actual.getId(), actual == null ? null : actual.getNombre());
    }
}
