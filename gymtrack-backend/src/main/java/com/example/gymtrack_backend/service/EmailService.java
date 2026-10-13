package com.example.gymtrack_backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Envío de mails por SMTP (Gmail, Outlook o el servidor del dominio del gimnasio).
 * Dónde se configura: ver CONFIGURAR-MAIL.md (variables MAIL_* en Render).
 *
 * Si mail.enabled=false, los métodos no hacen nada (útil para pruebas locales).
 * Los envíos van en segundo plano para no demorar la pantalla del staff.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${mail.from}")
    private String from;

    @Value("${mail.enabled:false}")
    private boolean enabled;

    /** El mail está activado (MAIL_ENABLED=true y servidor configurado) */
    public boolean habilitado() {
        return enabled;
    }

    /** Dirección que aparece como remitente */
    public String remitente() {
        return from;
    }

    /**
     * Envía un email a un destinatario único (en segundo plano: no frena la pantalla).
     */
    @org.springframework.scheduling.annotation.Async
    public void enviar(String para, String asunto, String cuerpo) {
        if (!enabled) {
            log.info("[EmailService] Email deshabilitado. No se envía a: {}", para);
            return;
        }
        if (para == null || para.isBlank()) {
            log.warn("[EmailService] Email de destino vacío — se omite envío");
            return;
        }
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(from);
            msg.setTo(para);
            msg.setSubject(asunto);
            msg.setText(cuerpo);
            mailSender.send(msg);
            log.info("[EmailService] Email enviado a: {}", para);
        } catch (MailException e) {
            log.error("[EmailService] Error al enviar a {}: {}", para, e.getMessage());
        }
    }

    /**
     * Envía el mismo email a múltiples destinatarios (uno por uno, no en CC).
     */
    @org.springframework.scheduling.annotation.Async
    public void enviarMasivo(List<String> destinatarios, String asunto, String cuerpo) {
        if (!enabled) {
            log.info("[EmailService] Email deshabilitado. Se omiten {} envíos.", destinatarios.size());
            return;
        }
        int enviados = 0;
        for (String email : destinatarios) {
            enviar(email, asunto, cuerpo);
            enviados++;
        }
        log.info("[EmailService] Envío masivo completado: {}/{} emails procesados.", enviados, destinatarios.size());
    }
}
