package com.example.gymtrack_backend.demo;

import java.util.regex.Pattern;

/**
 * Demo pública: la copia de los datos de prueba del visitante que hizo el pedido en curso.
 * Cada visitante tiene su propio esquema de PostgreSQL (v_xxxxxxxxxxxx); sin visitante se usa "public".
 */
public final class DemoContexto {

    private static final ThreadLocal<String> ESQUEMA = new ThreadLocal<>();
    private static final Pattern VALIDO = Pattern.compile("^v_[0-9a-f]{12}$");

    private DemoContexto() {}

    public static String actual() { return ESQUEMA.get(); }

    public static void usar(String esquema) {
        if (esquema != null && !valido(esquema)) throw new IllegalArgumentException("Esquema de demo inválido");
        ESQUEMA.set(esquema);
    }

    public static void limpiar() { ESQUEMA.remove(); }

    public static boolean valido(String esquema) { return esquema != null && VALIDO.matcher(esquema).matches(); }

    /** Clave de memoria que no mezcla a un visitante con otro (ej. "v_abc…:carla") */
    public static String clave(String valor) {
        String e = ESQUEMA.get();
        return e == null ? valor : e + ":" + valor;
    }
}
