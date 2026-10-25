package com.example.gymtrack_backend.web;

import com.example.gymtrack_backend.entities.ConfiguracionGimnasio;
import com.example.gymtrack_backend.repository.ConfiguracionGimnasioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Marca del gimnasio. La lectura es pública (la usa la pantalla de ingreso, antes de iniciar sesión);
 * solo el admin la cambia.
 */
@RestController
@RequestMapping("/api/v1/configuracion")
@RequiredArgsConstructor
public class ConfiguracionController {

    /** Logo de hasta ~300 KB (como data URL) */
    private static final int LOGO_MAX = 400_000;

    private final ConfiguracionGimnasioRepository repo;
    private final com.example.gymtrack_backend.service.Catalogo catalogo;

    public record Marca(String nombre, String logo, String colorAcento) {}

    @GetMapping("/marca")
    public ResponseEntity<Marca> marca() {
        ConfiguracionGimnasio c = catalogo.config().orElseGet(this::actual);
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(5, TimeUnit.MINUTES).cachePublic())
                .body(new Marca(c.getNombre(), c.getLogo(), c.getColorAcento()));
    }

    @PutMapping("/marca")
    @PreAuthorize("hasRole('ADMIN')")
    public Marca guardar(@RequestBody Map<String, String> body) {
        ConfiguracionGimnasio c = actual();
        String nombre = body.get("nombre") == null ? "" : body.get("nombre").trim();
        if (nombre.isEmpty() || nombre.length() > 80) throw new IllegalArgumentException("El nombre debe tener entre 1 y 80 caracteres");
        String color = body.get("colorAcento");
        if (color != null && !color.isBlank() && !color.matches("#[0-9A-Fa-f]{6}")) {
            throw new IllegalArgumentException("El color tiene que tener el formato #RRGGBB");
        }
        String logo = body.get("logo");
        if (logo != null && !logo.isBlank()) {
            if (logo.length() > LOGO_MAX) throw new IllegalArgumentException("El logo es muy pesado: usá una imagen de menos de 300 KB");
            if (!logo.matches("^data:image/(png|jpeg|webp|svg\\+xml);base64,[A-Za-z0-9+/=]+$")) {
                throw new IllegalArgumentException("El logo tiene que ser una imagen PNG, JPG, WEBP o SVG");
            }
        }
        c.setNombre(nombre);
        c.setColorAcento(color == null || color.isBlank() ? null : color.toUpperCase());
        c.setLogo(logo == null || logo.isBlank() ? null : logo);
        c.setActualizado(LocalDateTime.now());
        repo.save(c);
        return new Marca(c.getNombre(), c.getLogo(), c.getColorAcento());
    }

    public record Rutinas(int semanasMax) {}

    /** Duración máxima de una rutina antes de renovarla (la ve el staff; la cambia el admin) */
    @GetMapping("/rutinas")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESOR')")
    public Rutinas rutinas() {
        Integer s = actual().getSemanasRutina();
        return new Rutinas(s == null ? com.example.gymtrack_backend.service.ReglasRutina.SEMANAS_POR_DEFECTO : s);
    }

    @PutMapping("/rutinas")
    @PreAuthorize("hasRole('ADMIN')")
    public Rutinas guardarRutinas(@RequestBody Map<String, Integer> body) {
        Integer s = body.get("semanasMax");
        if (s == null || s < com.example.gymtrack_backend.service.ReglasRutina.SEMANAS_MIN || s > com.example.gymtrack_backend.service.ReglasRutina.SEMANAS_MAX) {
            throw new IllegalArgumentException("Elegí entre " + com.example.gymtrack_backend.service.ReglasRutina.SEMANAS_MIN + " y " + com.example.gymtrack_backend.service.ReglasRutina.SEMANAS_MAX + " semanas");
        }
        ConfiguracionGimnasio c = actual();
        c.setSemanasRutina(s);
        c.setActualizado(LocalDateTime.now());
        repo.save(c);
        return new Rutinas(s);
    }

    private ConfiguracionGimnasio actual() {
        return repo.findById(ConfiguracionGimnasio.ID).orElseGet(ConfiguracionGimnasio::new);
    }
}
