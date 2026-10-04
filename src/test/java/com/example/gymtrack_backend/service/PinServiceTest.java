package com.example.gymtrack_backend.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PinServiceTest {

    private final PinService pins = new PinService(null, null, null);

    @Test
    void rechazaPinesObvios() {
        for (String p : new String[]{"0000", "1111", "1234", "4321", "6789", "1212", "2580", "12a4", "123", "12345", null}) {
            assertTrue(pins.esDebil(p, null), "debería ser débil: " + p);
        }
    }

    @Test
    void rechazaPinQueEsParteDelDni() {
        assertTrue(pins.esDebil("3029", "30291047"));
        assertTrue(pins.esDebil("1047", "30291047"));
        assertFalse(pins.esDebil("5831", "30291047"));
    }

    @Test
    void generaPinesDeCuatroDigitosNoObvios() {
        for (int i = 0; i < 2000; i++) {
            String p = pins.generarPin();
            assertTrue(p.matches("[0-9]{4}"));
            assertFalse(pins.esDebil(p, null), p);
        }
    }
}
