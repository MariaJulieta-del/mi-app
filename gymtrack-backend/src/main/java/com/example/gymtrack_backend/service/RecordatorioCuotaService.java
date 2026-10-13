package com.example.gymtrack_backend.service;

import com.example.gymtrack_backend.entities.*;
import com.example.gymtrack_backend.entities.enums.EstadoMembresia;
import com.example.gymtrack_backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;

/**
 * PB-17: recordatorio automático de vencimiento de cuota.
 *
 * Cada socio activo recibe, por cada vencimiento:
 *  - un aviso unos días antes (los días los define el admin; 3 por defecto), y
 *  - si se lo deja vencer, otro aviso en los 3 días siguientes (se puede apagar).
 * Llega a la app del socio y, si tiene mail y el servidor de mail está configurado, también por mail.
 *
 * Corre cada hora (de 9 a 21) y al arrancar: como cada recordatorio queda registrado, nunca se repite,
 * y si el servidor estuvo dormido (Render gratis) igual sale cuando se despierta.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RecordatorioCuotaService {

    public static final int DIAS_MIN = 1;
    public static final int DIAS_MAX = 15;
    /** Hasta cuántos días después de vencida se manda el aviso de "venció" */
    static final int DIAS_VENCIDA = 3;
    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("dd/MM");

    private final MembresiaRepository membresiaRepo;
    private final TarifaMembresiaRepository tarifaRepo;
    private final RecordatorioCuotaRepository recordatorioRepo;
    private final NotificacionRepository notificacionRepo;
    private final ConfiguracionGimnasioRepository configRepo;
    private final EmailService emailService;

    public record Resultado(boolean activo, int revisados, int avisosApp, int mails) {}

    @Scheduled(cron = "0 15 9-21 * * *")
    public void programado() {
        Resultado r = ejecutar();
        if (r.avisosApp() > 0) log.info("Recordatorios de cuota: {} avisos ({} por mail)", r.avisosApp(), r.mails());
    }

    /** Manda los recordatorios que correspondan hoy y todavía no se mandaron */
    @Transactional
    public synchronized Resultado ejecutar() {
        ConfiguracionGimnasio c = configRepo.findById(ConfiguracionGimnasio.ID).orElseGet(ConfiguracionGimnasio::new);
        if (!Boolean.TRUE.equals(c.getRecordatorioActivo())) return new Resultado(false, 0, 0, 0);
        int dias = c.getRecordatorioDias() == null ? 3 : Math.max(DIAS_MIN, Math.min(DIAS_MAX, c.getRecordatorioDias()));
        boolean porMail = Boolean.TRUE.equals(c.getRecordatorioMail()) && emailService.habilitado();
        LocalDate hoy = LocalDate.now();
        int revisados = 0, avisos = 0, mails = 0;

        for (Membresia m : membresiaRepo.todasConSocio()) {
            Socio s = m.getSocio();
            if (s == null || !Boolean.TRUE.equals(s.getActivo()) || m.getFechaVencimiento() == null) continue;
            if (m.getEstadoMembresia() == EstadoMembresia.CANCELADA) continue;
            revisados++;
            long venceEn = ChronoUnit.DAYS.between(hoy, m.getFechaVencimiento());
            String tipo;
            if (venceEn >= 0 && venceEn <= dias && m.getEstadoMembresia() == EstadoMembresia.ACTIVA) tipo = RecordatorioCuota.ANTES;
            else if (venceEn < 0 && venceEn >= -DIAS_VENCIDA && Boolean.TRUE.equals(c.getRecordatorioVencida())) tipo = RecordatorioCuota.VENCIDA;
            else continue;
            if (recordatorioRepo.existsBySocioIdAndFechaVencimientoAndTipo(s.getId(), m.getFechaVencimiento(), tipo)) continue;

            String plan = tarifaRepo.findById(m.getTipoMembresia()).map(TarifaMembresia::getNombre).orElse(m.getTipoMembresia());
            BigDecimal precio = tarifaRepo.findById(m.getTipoMembresia()).map(TarifaMembresia::getPrecio).orElse(m.getPrecio());
            Mensaje msg = mensaje(tipo, s.getNombre(), plan, precio, m.getFechaVencimiento(), venceEn, c.getNombre());
            boolean conMail = porMail && s.getEmail() != null && !s.getEmail().isBlank();

            Notificacion n = new Notificacion();
            n.setTitulo(msg.titulo());
            n.setMensaje(msg.texto());
            n.setTipo("CUOTA");
            n.setDestinatario("SOCIO");
            n.setSocio(s);
            n.setPorEmail(conMail);
            notificacionRepo.save(n);

            RecordatorioCuota r = new RecordatorioCuota();
            r.setSocio(s);
            r.setFechaVencimiento(m.getFechaVencimiento());
            r.setTipo(tipo);
            r.setEnviado(LocalDateTime.now());
            r.setPorMail(conMail);
            recordatorioRepo.save(r);

            if (conMail) {
                emailService.enviar(s.getEmail().trim(), msg.asunto(), msg.cuerpoMail());
                mails++;
            }
            avisos++;
        }
        return new Resultado(true, revisados, avisos, mails);
    }

    record Mensaje(String titulo, String texto, String asunto, String cuerpoMail) {}

    static Mensaje mensaje(String tipo, String nombre, String plan, BigDecimal precio, LocalDate vence, long venceEn, String gimnasio) {
        String fecha = vence.format(FECHA);
        String importe = precio == null ? "" : " (" + NumberFormat.getCurrencyInstance(Locale.forLanguageTag("es-AR")).format(precio).replace("\u00a0", " ") + ")";
        String gym = gimnasio == null || gimnasio.isBlank() ? "el gimnasio" : gimnasio;
        String titulo, texto, asunto;
        if (RecordatorioCuota.ANTES.equals(tipo)) {
            String cuando = venceEn == 0 ? "hoy" : venceEn == 1 ? "mañana" : "en " + venceEn + " días";
            titulo = "Tu cuota vence " + cuando;
            texto = "Hola " + nombre + ": tu plan " + plan + " vence el " + fecha + ". Renovalo" + importe
                    + " en recepción o por transferencia y seguí entrenando sin cortes.";
            asunto = gym + ": tu cuota vence el " + fecha;
        } else {
            titulo = "Se venció tu cuota";
            texto = "Hola " + nombre + ": tu plan " + plan + " venció el " + fecha + " y por ahora no podés ingresar. Renovalo" + importe
                    + " en recepción o por transferencia y volvé a entrenar. ¡Te esperamos!";
            asunto = gym + ": se venció tu cuota";
        }
        String cuerpo = texto + "\n\nSi ya pagaste, no hace falta que hagas nada.\n\n" + gym
                + "\n\n(Mensaje automático: no hace falta responderlo.)";
        return new Mensaje(titulo, texto, asunto, cuerpo);
    }

    // ── Para la pantalla del admin ──

    public record Enviado(Long socioId, String socio, String tipo, LocalDate fechaVencimiento, LocalDateTime enviado, boolean porMail) {}

    @Transactional(readOnly = true)
    public List<Enviado> ultimos(int dias) {
        return recordatorioRepo.desde(LocalDateTime.now().minusDays(dias)).stream()
                .map(r -> new Enviado(r.getSocio().getId(), r.getSocio().getNombre() + " " + r.getSocio().getApellido(),
                        r.getTipo(), r.getFechaVencimiento(), r.getEnviado(), Boolean.TRUE.equals(r.getPorMail())))
                .toList();
    }
}
