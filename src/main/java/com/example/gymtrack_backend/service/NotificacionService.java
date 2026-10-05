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

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificacionService {

    private final NotificacionRepository repo;
    private final SocioRepository        socioRepo;
    private final EmailService           emailService;
    private final com.example.gymtrack_backend.repository.DisciplinaRepository disciplinaRepo;
    private final com.example.gymtrack_backend.repository.InscripcionDisciplinaRepository inscripcionRepo;

    // ── Listar notificaciones activas (staff) ─────────────────────────────────
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<NotificacionResponseDTO> listar() {
        return repo.findByActivaTrueOrderByFechaCreacionDesc().stream().map(NotificacionService::dto).toList();
    }

    /** Avisos de los últimos 60 días que le corresponden a un socio */
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<NotificacionResponseDTO> listarParaSocio(Long socioId) {
        List<Long> disciplinas = inscripcionRepo.findConDisciplinaBySocioId(socioId).stream()
                .map(i -> i.getDisciplina().getId()).toList();
        return repo.findParaSocio(socioId, disciplinas.isEmpty() ? List.of(-1L) : disciplinas,
                        java.time.LocalDateTime.now().minusDays(60))
                .stream().map(NotificacionService::dto).toList();
    }

    // ── Crear notificación y enviar email según destinatario ─────────────────
    @org.springframework.transaction.annotation.Transactional
    public NotificacionResponseDTO crear(NotificacionRequestDTO dto) {
        Notificacion n = new Notificacion();
        n.setTitulo(dto.getTitulo());
        n.setMensaje(dto.getMensaje());
        n.setTipo(dto.getTipo() != null ? dto.getTipo() : "AVISO");
        n.setDestinatario(dto.getDestinatario() != null ? dto.getDestinatario() : "TODOS");
        if (dto.getSocioId() != null) {
            n.setSocio(socioRepo.findById(dto.getSocioId())
                    .orElseThrow(() -> new IllegalArgumentException("Socio no encontrado")));
            n.setDestinatario("SOCIO");
        }
        Notificacion guardada = repo.save(n);
        enviarEmail(guardada);
        return dto(guardada);
    }

    public record AvisoEnviado(NotificacionResponseDTO aviso, int alumnos, int conEmail) {}

    /** Aviso a los alumnos activos de una disciplina (lo ven en la app y, si está activado, por email) */
    @org.springframework.transaction.annotation.Transactional
    public AvisoEnviado avisarDisciplina(Long disciplinaId, String titulo, String mensaje) {
        if (titulo == null || titulo.isBlank()) throw new IllegalArgumentException("Poné un título para el aviso");
        if (mensaje == null || mensaje.isBlank()) throw new IllegalArgumentException("Escribí el mensaje");
        Disciplina d = disciplinaRepo.findById(disciplinaId)
                .orElseThrow(() -> new IllegalArgumentException("Disciplina no encontrada"));
        List<Socio> alumnos = inscripcionRepo.findConSocioByDisciplinaId(disciplinaId).stream()
                .map(com.example.gymtrack_backend.entities.InscripcionDisciplina::getSocio)
                .filter(s -> Boolean.TRUE.equals(s.getActivo())).toList();
        if (alumnos.isEmpty()) throw new IllegalArgumentException(d.getNombre() + " no tiene alumnos activos para avisar");

        Notificacion n = new Notificacion();
        n.setTitulo(titulo.trim());
        n.setMensaje(mensaje.trim());
        n.setTipo("CLASE");
        n.setDestinatario("DISCIPLINA");
        n.setDisciplina(d);
        Notificacion guardada = repo.save(n);

        List<String> emails = alumnos.stream().map(Socio::getEmail).filter(e -> e != null && !e.isBlank()).toList();
        emailService.enviarMasivo(emails, "[GymTrack] " + d.getNombre() + ": " + guardada.getTitulo(), construirCuerpo(guardada));
        com.example.gymtrack_backend.auditoria.AuditoriaInterceptor.detalle(d.getNombre() + " · " + guardada.getTitulo() + " · " + alumnos.size() + " alumnos");
        return new AvisoEnviado(dto(guardada), alumnos.size(), emails.size());
    }

    private static NotificacionResponseDTO dto(Notificacion n) {
        return new NotificacionResponseDTO(
                n.getId(), n.getTitulo(), n.getMensaje(), n.getTipo(), n.getDestinatario(),
                n.getSocio() != null ? n.getSocio().getId() : null,
                n.getDisciplina() != null ? n.getDisciplina().getId() : null,
                n.getDisciplina() != null ? n.getDisciplina().getNombre() : null,
                n.getFechaCreacion(), n.getActiva());
    }

    // ── Archivar notificación ────────────────────────────────────────────────
    public void archivar(Long id) {
        Notificacion n = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Notificación no encontrada"));
        n.setActiva(false);
        repo.save(n);
    }

    // ── Lógica de envío de email ─────────────────────────────────────────────
    private void enviarEmail(Notificacion n) {
        String asunto = "[GymTrack] " + n.getTitulo();
        String cuerpo = construirCuerpo(n);

        switch (n.getDestinatario()) {
            case "TODOS" -> {
                // Enviar a todos los socios activos que tengan email
                List<String> emails = socioRepo.findByActivoTrue().stream()
                        .map(Socio::getEmail)
                        .filter(e -> e != null && !e.isBlank())
                        .toList();
                log.info("[NotificacionService] Enviando a {} socios activos", emails.size());
                emailService.enviarMasivo(emails, asunto, cuerpo);
            }
            case "SOCIO" -> {
                // Enviar solo al socio específico
                if (n.getSocio() != null && n.getSocio().getEmail() != null) {
                    emailService.enviar(n.getSocio().getEmail(), asunto, cuerpo);
                }
            }
            default -> log.info("[NotificacionService] Destinatario '{}' — sin envío de email", n.getDestinatario());
        }
    }

    private String construirCuerpo(Notificacion n) {
        return """
                Hola,

                Tenés una nueva notificación de GymTrack:

                %s

                ---
                Este mensaje fue enviado automáticamente por el sistema GymTrack.
                """.formatted(n.getMensaje());
    }
}
