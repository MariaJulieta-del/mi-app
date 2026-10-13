package com.example.gymtrack_backend.service;

import com.example.gymtrack_backend.repository.MembresiaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/**
 * Pasa a VENCIDA las membresías ACTIVAS cuya fechaVencimiento ya pasó.
 * Corre al iniciar la aplicación (por si estuvo apagada) y todos los días a las 00:05.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MembresiaVencimientoJob {

    private final MembresiaRepository membresiaRepository;

    @EventListener(ApplicationReadyEvent.class)
    @Scheduled(cron = "0 5 0 * * *")
    @Transactional
    public void vencerMembresias() {
        int vencidas = membresiaRepository.vencerMembresiasExpiradas(LocalDate.now());
        if (vencidas > 0) {
            log.info("[MembresiaVencimientoJob] {} membresía(s) pasaron a VENCIDA", vencidas);
        }
    }
}
