package com.example.gymtrack_backend.web;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** Para el "health check" de Render: responde 200 si el backend está arriba */
@RestController
public class SaludController {

    @GetMapping("/api/v1/salud")
    public ResponseEntity<Map<String, String>> salud() {
        return ResponseEntity.ok(Map.of("estado", "ok"));
    }
}
