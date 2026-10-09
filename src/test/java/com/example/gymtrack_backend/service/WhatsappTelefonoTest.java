package com.example.gymtrack_backend.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class WhatsappTelefonoTest {

    @Test
    void celularesArgentinosEnLosFormatosDeSiempre() {
        assertEquals("5491112345678", NotificacionService.telefonoWhatsapp("11 1234-5678"));
        assertEquals("5491112345678", NotificacionService.telefonoWhatsapp("011 15 1234-5678"));
        assertEquals("5493511234567", NotificacionService.telefonoWhatsapp("0351 15 123-4567"));
        assertEquals("5492994123456", NotificacionService.telefonoWhatsapp("(0299) 15-412-3456"));
    }

    @Test
    void conCodigoDePais() {
        assertEquals("5491112345678", NotificacionService.telefonoWhatsapp("+54 9 11 1234-5678"));
        assertEquals("5491112345678", NotificacionService.telefonoWhatsapp("54 11 1234 5678"));
        assertEquals("59899123456", NotificacionService.telefonoWhatsapp("+598 99 123 456"));
    }

    @Test
    void loQueNoEsUnTelefono() {
        assertNull(NotificacionService.telefonoWhatsapp(null));
        assertNull(NotificacionService.telefonoWhatsapp(""));
        assertNull(NotificacionService.telefonoWhatsapp("1234"));
        assertNull(NotificacionService.telefonoWhatsapp("sin teléfono"));
    }
}
