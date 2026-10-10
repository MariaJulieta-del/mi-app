package com.example.gymtrack_backend.service;

import com.example.gymtrack_backend.backup.BackupService;
import com.example.gymtrack_backend.entities.RecordatorioCuota;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class RecordatorioYBackupTest {

    private static final LocalDate VENCE = LocalDate.of(2026, 10, 12);

    @Test
    void recordatorioAntesDiceCuandoVenceElPlanYElPrecio() {
        var m = RecordatorioCuotaService.mensaje(RecordatorioCuota.ANTES, "Ana", "Mensual", new BigDecimal("15000"), VENCE, 3, "Gym Sur");
        assertEquals("Tu cuota vence en 3 días", m.titulo());
        assertTrue(m.texto().contains("Mensual") && m.texto().contains("12/10") && m.texto().contains("15.000"), m.texto());
        assertEquals("Gym Sur: tu cuota vence el 12/10", m.asunto());
        assertTrue(m.cuerpoMail().endsWith("Gym Sur\n\n(Mensaje automático: no hace falta responderlo.)"));
        assertFalse(m.cuerpoMail().contains("💪"));
    }

    @Test
    void recordatorioDeHoyYDeMañana() {
        assertEquals("Tu cuota vence hoy", RecordatorioCuotaService.mensaje(RecordatorioCuota.ANTES, "A", "P", null, VENCE, 0, "G").titulo());
        assertEquals("Tu cuota vence mañana", RecordatorioCuotaService.mensaje(RecordatorioCuota.ANTES, "A", "P", null, VENCE, 1, "G").titulo());
    }

    @Test
    void recordatorioDeVencidaAvisaQueNoPuedeEntrar() {
        var m = RecordatorioCuotaService.mensaje(RecordatorioCuota.VENCIDA, "Ana", "Mensual", null, VENCE, -2, null);
        assertEquals("Se venció tu cuota", m.titulo());
        assertTrue(m.texto().contains("venció el 12/10") && m.texto().contains("no podés ingresar"));
        assertFalse(m.texto().contains("($"), "sin precio no muestra importe");
        assertEquals("el gimnasio: se venció tu cuota", m.asunto());
    }

    @Test
    void soloSeAceptanNombresDeCopiasGenerados() {
        assertTrue(BackupService.esNombreValido("gymtrack-backup-20261009-223050.zip"));
        assertFalse(BackupService.esNombreValido("../gymtrack-backup-20261009-223050.zip"));
        assertFalse(BackupService.esNombreValido("gymtrack-backup-20261009-223050.zip/../../etc"));
        assertFalse(BackupService.esNombreValido("otro.zip"));
        assertFalse(BackupService.esNombreValido(null));
    }
}
