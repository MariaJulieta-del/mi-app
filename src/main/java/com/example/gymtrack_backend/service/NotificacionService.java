package com.example.gymtrack_backend.service;

import com.example.gymtrack_backend.entities.Disciplina;

import com.example.gymtrack_backend.dto.NotificacionRequestDTO;
import com.example.gymtrack_backend.dto.NotificacionResponseDTO;
import com.example.gymtrack_backend.entities.Notificacion;
import com.example.gymtrack_backend.entities.Socio;
import com.example.gymtrack_backend.repository.NotificacionRepository;
import com.example.gymtrack_backend.repository.SocioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Avisos a los socios por tres canales:
 *  - App: siempre (el socio los ve en su inicio).
 *  - Mail: si está configurado (ver CONFIGURAR-MAIL.md) y se pidió; se manda en segundo plano.
 *  - WhatsApp: sin API paga. Se arman links wa.me con el mensaje listo para que el staff
 *    los mande desde su WhatsApp (uno por socio) o lo copie a una lista de difusión.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificacionService {

    private final NotificacionRepository repo;
    private final SocioRepository        socioRepo;
    private final EmailService           emailService;
    private final com.example.gymtrack_backend.repository.DisciplinaRepository disciplinaRepo;
    private final com.example.gymtrack_backend.repository.InscripcionDisciplinaRepository inscripcionRepo;
    private final com.example.gymtrack_backend.repository.ConfiguracionGimnasioRepository configRepo;

    // ── Historial para el staff (activos y archivados; sin los automáticos) ──────
    @Transactional(readOnly = true)
    public List<NotificacionResponseDTO> listar() {
        return repo.findTop300ByOrderByFechaCreacionDesc().stream()
                .filter(n -> !"RETENCION".equals(n.getTipo()) && !"RESERVA".equals(n.getTipo()) && !"CUOTA".equals(n.getTipo()))
                .map(NotificacionService::dto).toList();
    }

    /** Avisos de los últimos 60 días que le corresponden a un socio */
    @Transactional(readOnly = true)
    public List<NotificacionResponseDTO> listarParaSocio(Long socioId) {
        List<Long> disciplinas = inscripcionRepo.findConDisciplinaBySocioId(socioId).stream()
                .map(i -> i.getDisciplina().getId()).toList();
        return repo.findParaSocio(socioId, disciplinas.isEmpty() ? List.of(-1L) : disciplinas,
                        java.time.LocalDateTime.now().minusDays(60))
                .stream().map(NotificacionService::dto).toList();
    }

    // ── Canales ───────────────────────────────────────────────────────────────

    /** Qué canales están listos y a cuántos socios llega cada uno */
    public record Canales(boolean email, String remitente, int socios, int conEmail, int conTelefono) {}

    @Transactional(readOnly = true)
    public Canales canales() {
        List<Socio> activos = socioRepo.findByActivoTrue();
        return new Canales(emailService.habilitado(), emailService.remitente(), activos.size(),
                (int) activos.stream().filter(s -> s.getEmail() != null && !s.getEmail().isBlank()).count(),
                (int) activos.stream().filter(s -> telefonoWhatsapp(s.getTelefono()) != null).count());
    }

    // ── Crear y enviar ────────────────────────────────────────────────────────

    public record AvisoEnviado(NotificacionResponseDTO aviso, int alumnos, int conEmail) {}

    @Transactional
    public NotificacionResponseDTO crear(NotificacionRequestDTO dto) {
        if (dto.getDisciplinaId() != null) {
            return avisarDisciplina(dto.getDisciplinaId(), dto.getTitulo(), dto.getMensaje(),
                    !Boolean.FALSE.equals(dto.getPorEmail()), Boolean.TRUE.equals(dto.getPorWhatsapp()), dto.getTipo()).aviso();
        }
        Notificacion n = new Notificacion();
        n.setTitulo(dto.getTitulo().trim());
        n.setMensaje(dto.getMensaje().trim());
        n.setTipo(dto.getTipo() != null ? dto.getTipo() : "AVISO");
        n.setDestinatario(dto.getDestinatario() != null ? dto.getDestinatario() : "TODOS");
        n.setPorEmail(!Boolean.FALSE.equals(dto.getPorEmail()));
        n.setPorWhatsapp(Boolean.TRUE.equals(dto.getPorWhatsapp()));
        if (dto.getSocioId() != null) {
            n.setSocio(socioRepo.findById(dto.getSocioId())
                    .orElseThrow(() -> new IllegalArgumentException("Socio no encontrado")));
            n.setDestinatario("SOCIO");
        }
        Notificacion guardada = repo.save(n);
        if (guardada.getPorEmail()) {
            List<String> emails = destinatarios(guardada).stream().map(Socio::getEmail).filter(e -> e != null && !e.isBlank()).toList();
            emailService.enviarMasivo(emails, asunto(guardada), construirCuerpo(guardada));
        }
        return dto(guardada);
    }

    /** Aviso a los alumnos activos de una disciplina (desde Disciplinas) */
    @Transactional
    public AvisoEnviado avisarDisciplina(Long disciplinaId, String titulo, String mensaje) {
        return avisarDisciplina(disciplinaId, titulo, mensaje, true, false, "CLASE");
    }

    @Transactional
    public AvisoEnviado avisarDisciplina(Long disciplinaId, String titulo, String mensaje, boolean porEmail, boolean porWhatsapp, String tipo) {
        if (titulo == null || titulo.isBlank()) throw new IllegalArgumentException("Poné un título para el aviso");
        if (mensaje == null || mensaje.isBlank()) throw new IllegalArgumentException("Escribí el mensaje");
        Disciplina d = disciplinaRepo.findById(disciplinaId)
                .orElseThrow(() -> new IllegalArgumentException("Disciplina no encontrada"));
        List<Socio> alumnos = alumnosActivos(disciplinaId);
        if (alumnos.isEmpty()) throw new IllegalArgumentException(d.getNombre() + " no tiene alumnos activos para avisar");

        Notificacion n = new Notificacion();
        n.setTitulo(titulo.trim());
        n.setMensaje(mensaje.trim());
        n.setTipo(tipo == null || tipo.isBlank() || "AVISO".equals(tipo) ? "CLASE" : tipo);
        n.setDestinatario("DISCIPLINA");
        n.setDisciplina(d);
        n.setPorEmail(porEmail);
        n.setPorWhatsapp(porWhatsapp);
        Notificacion guardada = repo.save(n);

        List<String> emails = alumnos.stream().map(Socio::getEmail).filter(e -> e != null && !e.isBlank()).toList();
        if (porEmail) emailService.enviarMasivo(emails, "[" + nombreGimnasio() + "] " + d.getNombre() + ": " + guardada.getTitulo(), construirCuerpo(guardada));
        com.example.gymtrack_backend.auditoria.AuditoriaInterceptor.detalle(d.getNombre() + " · " + guardada.getTitulo() + " · " + alumnos.size() + " alumnos");
        return new AvisoEnviado(dto(guardada), alumnos.size(), emails.size());
    }

    // ── WhatsApp ──────────────────────────────────────────────────────────────

    public record DestinoWhatsapp(Long socioId, String nombre, String telefono, String link) {}
    public record Whatsapp(String texto, List<DestinoWhatsapp> destinos, List<String> sinTelefono) {}

    /** Links de WhatsApp (wa.me) con el aviso listo, uno por socio con teléfono */
    @Transactional(readOnly = true)
    public Whatsapp whatsapp(Long id) {
        Notificacion n = repo.findById(id).orElseThrow(() -> new IllegalArgumentException("Aviso no encontrado"));
        String texto = textoWhatsapp(n);
        String codificado = URLEncoder.encode(texto, StandardCharsets.UTF_8).replace("+", "%20");
        List<DestinoWhatsapp> destinos = new java.util.ArrayList<>();
        List<String> sinTelefono = new java.util.ArrayList<>();
        for (Socio s : destinatarios(n)) {
            String tel = telefonoWhatsapp(s.getTelefono());
            String nombre = s.getNombre() + " " + s.getApellido();
            if (tel == null) sinTelefono.add(nombre);
            else destinos.add(new DestinoWhatsapp(s.getId(), nombre, tel, "https://wa.me/" + tel + "?text=" + codificado));
        }
        return new Whatsapp(texto, destinos, sinTelefono);
    }

    /**
     * Teléfono en formato internacional para wa.me (Argentina por defecto):
     * "11 1234-5678" → 5491112345678 · "0351 15 123-4567" → 5493511234567. null si no parece válido.
     */
    static String telefonoWhatsapp(String telefono) {
        if (telefono == null) return null;
        String t = telefono.trim();
        boolean internacional = t.startsWith("+");
        String d = t.replaceAll("\\D", "");
        if (d.isEmpty()) return null;
        if (internacional || d.startsWith("54")) {
            if (d.startsWith("54") && !d.startsWith("549") && d.length() == 12) d = "549" + d.substring(2);
            return d.length() >= 11 && d.length() <= 15 ? d : null;
        }
        if (d.startsWith("0")) d = d.substring(1);
        // Quitar el "15" de celular que va después del código de área (2 a 4 dígitos)
        if (d.length() == 12) {
            for (int area = 2; area <= 4; area++) {
                if (d.startsWith("15", area)) { d = d.substring(0, area) + d.substring(area + 2); break; }
            }
        }
        return d.length() == 10 ? "549" + d : null;
    }

    private String textoWhatsapp(Notificacion n) {
        return "*" + n.getTitulo() + "*\n" + n.getMensaje() + "\n\n— " + nombreGimnasio();
    }

    // ── Destinatarios ─────────────────────────────────────────────────────────

    private List<Socio> alumnosActivos(Long disciplinaId) {
        return inscripcionRepo.findConSocioByDisciplinaId(disciplinaId).stream()
                .map(com.example.gymtrack_backend.entities.InscripcionDisciplina::getSocio)
                .filter(s -> Boolean.TRUE.equals(s.getActivo())).toList();
    }

    private List<Socio> destinatarios(Notificacion n) {
        return switch (n.getDestinatario()) {
            case "SOCIO" -> n.getSocio() != null ? List.of(n.getSocio()) : List.of();
            case "DISCIPLINA" -> n.getDisciplina() != null ? alumnosActivos(n.getDisciplina().getId()) : List.of();
            default -> socioRepo.findByActivoTrue();
        };
    }

    private static NotificacionResponseDTO dto(Notificacion n) {
        return new NotificacionResponseDTO(
                n.getId(), n.getTitulo(), n.getMensaje(), n.getTipo(), n.getDestinatario(),
                n.getSocio() != null ? n.getSocio().getId() : null,
                n.getSocio() != null ? n.getSocio().getNombre() + " " + n.getSocio().getApellido() : null,
                n.getDisciplina() != null ? n.getDisciplina().getId() : null,
                n.getDisciplina() != null ? n.getDisciplina().getNombre() : null,
                n.getFechaCreacion(), n.getActiva(),
                !Boolean.FALSE.equals(n.getPorEmail()), Boolean.TRUE.equals(n.getPorWhatsapp()));
    }

    // ── Archivar notificación ────────────────────────────────────────────────
    public void archivar(Long id) {
        Notificacion n = repo.findById(id)
                .orElseThrow(() -> new com.example.gymtrack_backend.web.RecursoNoEncontradoException("Notificación no encontrada"));
        n.setActiva(false);
        repo.save(n);
    }

    // ── Mail ─────────────────────────────────────────────────────────────────
    private String nombreGimnasio() {
        return configRepo.findById(1L).map(c -> c.getNombre()).filter(x -> x != null && !x.isBlank()).orElse("GymTrack");
    }

    private String asunto(Notificacion n) {
        return "[" + nombreGimnasio() + "] " + n.getTitulo();
    }

    private String construirCuerpo(Notificacion n) {
        return """
                Hola,

                Tenés un aviso nuevo de %s:

                %s

                ---
                También lo ves en la app del gimnasio.
                """.formatted(nombreGimnasio(), n.getMensaje());
    }
}
