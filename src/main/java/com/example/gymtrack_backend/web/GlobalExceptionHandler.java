package com.example.gymtrack_backend.web;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;
import java.util.stream.Collectors;

/**
 * Maneja errores de validación (@Valid) y los devuelve con mensajes legibles.
 * Ayuda a diagnosticar qué campo falló la validación.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = ex.getBindingResult().getFieldErrors()
            .stream()
            .collect(Collectors.toMap(
                FieldError::getField,
                e -> e.getDefaultMessage() != null ? e.getDefaultMessage() : "Valor inválido",
                (a, b) -> a
            ));

        System.err.println("[GlobalExceptionHandler] Validación fallida: " + fieldErrors);

        return ResponseEntity.badRequest().body(Map.of(
            "error", "Validación fallida",
            "campos", fieldErrors
        ));
    }

    /** Sin permiso (rol o pertenencia) → 403 */
    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccesoDenegado(org.springframework.security.access.AccessDeniedException ex) {
        return ResponseEntity.status(403).body(Map.of("error", "No tenés permiso para realizar esta acción"));
    }

    /** JSON mal formado o tipos inválidos en el body → 400 */
    @ExceptionHandler({org.springframework.http.converter.HttpMessageNotReadableException.class,
                       org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class})
    public ResponseEntity<Map<String, Object>> handleBodyInvalido(Exception ex) {
        return ResponseEntity.badRequest().body(Map.of("error", "Datos inválidos en la solicitud"));
    }

    /** Errores de negocio con mensaje pensado para el usuario → 400 */
    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public ResponseEntity<Map<String, Object>> handleNegocio(RuntimeException ex) {
        return ResponseEntity.badRequest().body(Map.of("error",
                ex.getMessage() != null ? ex.getMessage() : "Solicitud inválida"));
    }

    /**
     * Resto de errores. Los servicios usan "new RuntimeException(mensaje)" para errores de negocio
     * (ej. "Socio no encontrado"): esos se devuelven tal cual. Cualquier otra excepción es un error
     * interno y se responde un mensaje genérico, sin detalles técnicos.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneral(Exception ex) {
        if (ex.getClass() == RuntimeException.class && ex.getMessage() != null) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
        if (ex instanceof org.springframework.web.ErrorResponse er) {
            // Errores propios de Spring MVC (404 de ruta, método no permitido, JSON mal formado…)
            return ResponseEntity.status(er.getStatusCode()).body(Map.of("error", "Solicitud inválida"));
        }
        log.error("Error no controlado", ex);
        return ResponseEntity.status(500).body(Map.of("error", "Ocurrió un error inesperado. Probá de nuevo."));
    }

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(GlobalExceptionHandler.class);
}
