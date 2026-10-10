package com.example.gymtrack_backend.web;

/**
 * Mensaje de error que se le puede mostrar al usuario.
 * Solo las excepciones de negocio (las que el código lanza con un texto pensado para la pantalla)
 * pasan su mensaje; las técnicas (SQL, nulos, etc.) se reemplazan por uno genérico para no
 * exponer detalles internos.
 */
public final class Errores {

    private Errores() {}

    public static final String GENERICO = "No se pudo completar la operación. Revisá los datos e intentá de nuevo.";

    public static boolean esDeNegocio(Throwable e) {
        return e.getClass() == RuntimeException.class
                || e instanceof IllegalArgumentException
                || e instanceof IllegalStateException
                || e instanceof RecursoNoEncontradoException;
    }

    public static String mensaje(RuntimeException e) {
        return esDeNegocio(e) && e.getMessage() != null ? e.getMessage() : GENERICO;
    }
}
