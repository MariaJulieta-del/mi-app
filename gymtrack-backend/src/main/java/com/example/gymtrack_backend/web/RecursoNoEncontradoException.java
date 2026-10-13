package com.example.gymtrack_backend.web;

/** Lo pedido no existe → 404 con un mensaje para el usuario */
public class RecursoNoEncontradoException extends RuntimeException {
    public RecursoNoEncontradoException(String mensaje) {
        super(mensaje);
    }
}
