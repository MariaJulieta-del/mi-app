package com.example.gymtrack_backend.web;

import com.example.gymtrack_backend.entities.Ejercicio;
import com.example.gymtrack_backend.repository.EjercicioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ejercicios")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EjercicioController {

    private final EjercicioRepository ejercicioRepo;

    /** Listar todos los ejercicios activos (opcionalmente filtrar por grupo muscular) */
    @GetMapping
    public List<Ejercicio> listar(
            @RequestParam(required = false) String grupo) {
        if (grupo != null && !grupo.isBlank()) {
            return ejercicioRepo.findByActivoTrueAndGruposContaining(grupo);
        }
        return ejercicioRepo.findByActivoTrue();
    }

    /** Listar TODOS incluyendo inactivos (para el panel admin) */
    @GetMapping("/todos")
    public List<Ejercicio> listarTodos() {
        return ejercicioRepo.findAll();
    }

    /** Obtener por ID */
    @GetMapping("/{id}")
    public ResponseEntity<Ejercicio> obtener(@PathVariable Long id) {
        return ejercicioRepo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Crear nuevo ejercicio — solo ADMIN o EMPLEADO */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    public ResponseEntity<Ejercicio> crear(@RequestBody Ejercicio ejercicio) {
        ejercicio.setId(null);
        if (ejercicio.getActivo() == null) ejercicio.setActivo(true);
        if (ejercicio.getEsMaquina() == null) ejercicio.setEsMaquina(false);
        if (ejercicio.getMaquinaIds() == null) ejercicio.setMaquinaIds(new java.util.ArrayList<>());
        return ResponseEntity.ok(ejercicioRepo.save(ejercicio));
    }

    /** Actualizar ejercicio — solo ADMIN o EMPLEADO */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    public ResponseEntity<Ejercicio> actualizar(@PathVariable Long id,
                                                @RequestBody Ejercicio datos) {
        return ejercicioRepo.findById(id).map(e -> {
            e.setNombre(datos.getNombre());
            e.setDescripcion(datos.getDescripcion());
            if (datos.getGrupos() != null) {
                e.getGrupos().clear();
                e.getGrupos().addAll(datos.getGrupos());
            }
            e.setEsMaquina(datos.getEsMaquina() != null ? datos.getEsMaquina() : false);
            if (datos.getActivo() != null) e.setActivo(datos.getActivo());
            e.setImagenUrl(datos.getImagenUrl());
            if (datos.getMaquinaIds() != null) {
                e.getMaquinaIds().clear();
                e.getMaquinaIds().addAll(datos.getMaquinaIds());
            }
            return ResponseEntity.ok(ejercicioRepo.save(e));
        }).orElse(ResponseEntity.notFound().build());
    }

    /** Dar de baja lógica — solo ADMIN o EMPLEADO */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    public ResponseEntity<Void> desactivar(@PathVariable Long id) {
        return ejercicioRepo.findById(id).map(e -> {
            e.setActivo(false);
            ejercicioRepo.save(e);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    /** Reactivar ejercicio — solo ADMIN o EMPLEADO */
    @PatchMapping("/{id}/activar")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    public ResponseEntity<Ejercicio> activar(@PathVariable Long id) {
        return ejercicioRepo.findById(id).map(e -> {
            e.setActivo(true);
            return ResponseEntity.ok(ejercicioRepo.save(e));
        }).orElse(ResponseEntity.notFound().build());
    }

    /** Grupos musculares disponibles */
    @GetMapping("/grupos")
    public List<String> grupos() {
        return List.of("Pecho", "Espalda", "Piernas", "Hombros", "Brazos", "Core", "Cardio", "Full Body");
    }

    /**
     * Proxy al catálogo ExerciseDB — lista paginada con filtro por bodyPart o búsqueda.
     * GET /api/v1/ejercicios/catalogo?bodyPart=chest&q=bench&limit=20&offset=0
     */
    @GetMapping("/catalogo")
    public ResponseEntity<String> catalogo(
            @RequestParam(defaultValue = "") String bodyPart,
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "0") int offset) {
        try {
            String url;
            if (!q.isBlank()) {
                // URLEncoder usa '+' para espacios (form encoding), pero el path necesita '%20'
                String encoded = URLEncoder.encode(q.trim(), StandardCharsets.UTF_8).replace("+", "%20");
                url = "https://exercisedb-api.vercel.app/api/v1/exercises/name/" + encoded
                      + "?limit=" + limit + "&offset=" + offset;
            } else if (!bodyPart.isBlank()) {
                url = "https://exercisedb-api.vercel.app/api/v1/exercises/bodyPart/"
                      + URLEncoder.encode(bodyPart, StandardCharsets.UTF_8).replace("+", "%20")
                      + "?limit=" + limit + "&offset=" + offset;
            } else {
                url = "https://exercisedb-api.vercel.app/api/v1/exercises?limit=" + limit + "&offset=" + offset;
            }
            String result = RestClient.create().get().uri(url)
                    .header("Accept", "application/json")
                    .retrieve().body(String.class);
            return ResponseEntity.ok().header("Content-Type", "application/json").body(result);
        } catch (Exception e) {
            return ResponseEntity.ok("{\"success\":false,\"data\":{\"exercises\":[]}}");
        }
    }

    /**
     * Lista de body parts disponibles en ExerciseDB.
     * GET /api/v1/ejercicios/catalogo/bodyparts
     */
    @GetMapping("/catalogo/bodyparts")
    public ResponseEntity<String> bodyParts() {
        try {
            String url = "https://exercisedb-api.vercel.app/api/v1/bodyPartList";
            String result = RestClient.create().get().uri(url)
                    .header("Accept", "application/json")
                    .retrieve().body(String.class);
            return ResponseEntity.ok().header("Content-Type", "application/json").body(result);
        } catch (Exception e) {
            return ResponseEntity.ok("{\"success\":true,\"data\":[\"back\",\"cardio\",\"chest\",\"lower arms\",\"lower legs\",\"neck\",\"shoulders\",\"upper arms\",\"upper legs\",\"waist\"]}");
        }
    }

    /**
     * Proxy a wger.de — busca ejercicios con imágenes, sin API key.
     * GET /api/v1/ejercicios/buscar-externo?q=bench+press
     */
    @GetMapping("/buscar-externo")
    public ResponseEntity<String> buscarExterno(
            @RequestParam String q,
            @RequestParam(defaultValue = "english") String language) {
        try {
            String encoded = URLEncoder.encode(q, StandardCharsets.UTF_8);
            String url = "https://wger.de/api/v2/exercise/search/?term="
                    + encoded + "&language=" + language + "&format=json";
            String result = RestClient.create()
                    .get().uri(url)
                    .header("Accept", "application/json")
                    .retrieve()
                    .body(String.class);
            return ResponseEntity.ok()
                    .header("Content-Type", "application/json")
                    .body(result);
        } catch (Exception e) {
            return ResponseEntity.ok("{\"suggestions\":[]}");
        }
    }

    /**
     * Proxy a wger.de — info completa de un ejercicio (músculos + imágenes).
     * GET /api/v1/ejercicios/info-externo/{baseId}
     */
    @GetMapping("/info-externo/{baseId}")
    public ResponseEntity<String> infoExterno(@PathVariable int baseId) {
        try {
            String url = "https://wger.de/api/v2/exerciseinfo/" + baseId + "/?format=json";
            String result = RestClient.create()
                    .get().uri(url)
                    .header("Accept", "application/json")
                    .retrieve()
                    .body(String.class);
            return ResponseEntity.ok()
                    .header("Content-Type", "application/json")
                    .body(result);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
