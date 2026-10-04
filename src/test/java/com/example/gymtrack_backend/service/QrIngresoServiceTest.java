package com.example.gymtrack_backend.service;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

class QrIngresoServiceTest {

    private final QrIngresoService qr = new QrIngresoService("secreto-de-prueba-de-al-menos-32-caracteres");

    @Test
    void aceptaElCodigoVigente() {
        assertTrue(qr.esValido(qr.codigoActual().codigo()));
    }

    @Test
    void rechazaCodigoAdulterado() {
        String codigo = qr.codigoActual().codigo();
        String adulterado = codigo.substring(0, codigo.length() - 2) + (codigo.endsWith("AA") ? "BB" : "AA");
        assertFalse(qr.esValido(adulterado));
        assertFalse(qr.esValido("GT1.123.abc"));
        assertFalse(qr.esValido("cualquier cosa"));
        assertFalse(qr.esValido(null));
    }

    @Test
    void rechazaCodigoDeOtroServidor() {
        QrIngresoService otro = new QrIngresoService("otro-secreto-distinto-de-al-menos-32-caracteres");
        assertFalse(qr.esValido(otro.codigoActual().codigo()));
    }

    @Test
    void rechazaCodigoVencidoODelFuturo() {
        String[] p = qr.codigoActual().codigo().split("[.]");
        long ventana = Instant.now().getEpochSecond() / QrIngresoService.VENTANA_SEG;
        // Misma firma con otra ventana no valida; y una ventana vieja (foto de hace 5 min) tampoco
        assertFalse(qr.esValido("GT1." + (ventana - 10) + "." + p[2]));
        assertFalse(qr.esValido("GT1." + (ventana + 1) + "." + p[2]));
    }
}
