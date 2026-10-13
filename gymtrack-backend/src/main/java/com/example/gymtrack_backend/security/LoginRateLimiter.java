package com.example.gymtrack_backend.security;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Límite de intentos de login en memoria (ventana deslizante).
 *
 *  - Staff: 5 intentos FALLIDOS por usuario+IP cada 15 minutos.
 *  - Socio: 10 intentos por IP por minuto (fallidos o no), para frenar que prueben DNIs en serie,
 *    y por DNI: 5 PIN fallidos cada 15 minutos y 15 por día, desde cualquier IP.
 *
 * Alcanza para un único servidor; con varias instancias habría que moverlo a Redis.
 */
@Component
public class LoginRateLimiter {

    public static final int MAX_FALLOS_STAFF = 5;
    public static final Duration VENTANA_STAFF = Duration.ofMinutes(15);
    public static final int MAX_INTENTOS_DNI = 10;
    public static final Duration VENTANA_DNI = Duration.ofMinutes(1);
    /** PIN fallido por DNI: 5 cada 15 min y 15 por día (probar los 10.000 PIN llevaría años) */
    public static final int MAX_FALLOS_PIN = 5;
    public static final Duration VENTANA_PIN = Duration.ofMinutes(15);
    public static final int MAX_FALLOS_PIN_DIA = 15;
    public static final Duration VENTANA_PIN_DIA = Duration.ofDays(1);

    private final Map<String, Deque<Instant>> registros = new ConcurrentHashMap<>();

    /** true si la clave ya superó el máximo dentro de la ventana */
    public boolean bloqueado(String clave, int max, Duration ventana) {
        Deque<Instant> q = registros.get(clave);
        if (q == null) return false;
        synchronized (q) {
            purgar(q, ventana);
            return q.size() >= max;
        }
    }

    public void registrar(String clave, Duration ventana) {
        Deque<Instant> q = registros.computeIfAbsent(clave, k -> new ArrayDeque<>());
        synchronized (q) {
            purgar(q, ventana);
            q.addLast(Instant.now());
        }
        if (registros.size() > 10_000) limpiarVacios(VENTANA_PIN_DIA);
    }

    public void limpiar(String clave) {
        registros.remove(clave);
    }

    private static void purgar(Deque<Instant> q, Duration ventana) {
        Instant limite = Instant.now().minus(ventana);
        while (!q.isEmpty() && q.peekFirst().isBefore(limite)) q.pollFirst();
    }

    private void limpiarVacios(Duration ventana) {
        registros.entrySet().removeIf(e -> {
            synchronized (e.getValue()) { purgar(e.getValue(), ventana); return e.getValue().isEmpty(); }
        });
    }
}
