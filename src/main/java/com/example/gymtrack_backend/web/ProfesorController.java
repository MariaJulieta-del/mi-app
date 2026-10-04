package com.example.gymtrack_backend.web;

import com.example.gymtrack_backend.entities.Usuario;
import com.example.gymtrack_backend.entities.enums.Rol;
import com.example.gymtrack_backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/profesores")
@RequiredArgsConstructor
public class ProfesorController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    /** Lista todos los usuarios con rol PROFESOR */
    @GetMapping
    public List<Map<String, Object>> listar() {
        return usuarioRepository.findByRol(Rol.PROFESOR).stream()
                .map(u -> {
                    Map<String, Object> m = new java.util.LinkedHashMap<>();
                    m.put("id", u.getId());
                    m.put("username", u.getUsername());
                    m.put("email", u.getEmail());
                    m.put("nombre", u.getNombre());
                    m.put("apellido", u.getApellido());
                    m.put("telefono", u.getTelefono());
                    m.put("especialidad", u.getEspecialidad());
                    m.put("activo", u.isActivo());
                    return m;
                })
                .toList();
    }

    /** Crea un nuevo profesor */
    @PostMapping
    public ResponseEntity<?> crear(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        String email    = body.get("email");

        if (username == null || username.isBlank())
            return ResponseEntity.badRequest().body("El nombre de usuario es obligatorio.");
        String errorPass = com.example.gymtrack_backend.security.PoliticaPassword.validar(password);
        if (errorPass != null)
            return ResponseEntity.badRequest().body(errorPass);
        if (usuarioRepository.existsByUsername(username))
            return ResponseEntity.badRequest().body("Ya existe un usuario con ese nombre.");

        Usuario u = new Usuario();
        u.setUsername(username.trim());
        u.setPassword(passwordEncoder.encode(password));
        u.setEmail(email);
        u.setNombre(body.get("nombre"));
        u.setApellido(body.get("apellido"));
        u.setTelefono(body.get("telefono"));
        u.setEspecialidad(body.get("especialidad"));
        u.setRol(Rol.PROFESOR);
        u.setActivo(true);
        usuarioRepository.save(u);

        return ResponseEntity.ok(Map.of("mensaje", "Profesor creado correctamente.", "username", username));
    }

    /** Edita username / email de un profesor */
    @PutMapping("/{id}")
    public ResponseEntity<?> editar(@PathVariable Long id, @RequestBody Map<String, String> body) {
        var u = usuarioRepository.findById(id).orElse(null);
        if (u == null || u.getRol() != Rol.PROFESOR)
            return ResponseEntity.notFound().build();

        String nuevoUsername = body.get("username");
        if (nuevoUsername != null && !nuevoUsername.isBlank()) {
            if (!nuevoUsername.equals(u.getUsername()) && usuarioRepository.existsByUsername(nuevoUsername))
                return ResponseEntity.badRequest().body("Ese nombre de usuario ya está en uso.");
            u.setUsername(nuevoUsername.trim());
        }
        if (body.containsKey("email"))       u.setEmail(body.get("email"));
        if (body.containsKey("nombre"))     u.setNombre(body.get("nombre"));
        if (body.containsKey("apellido"))   u.setApellido(body.get("apellido"));
        if (body.containsKey("telefono"))   u.setTelefono(body.get("telefono"));
        if (body.containsKey("especialidad")) u.setEspecialidad(body.get("especialidad"));
        if (body.get("password") != null && !body.get("password").isBlank()) {
            String errorPass = com.example.gymtrack_backend.security.PoliticaPassword.validar(body.get("password"));
            if (errorPass != null) return ResponseEntity.badRequest().body(errorPass);
            u.setPassword(passwordEncoder.encode(body.get("password")));
        }

        usuarioRepository.save(u);
        return ResponseEntity.ok(Map.of("mensaje", "Profesor actualizado."));
    }

    /** Activa / desactiva un profesor */
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<?> toggle(@PathVariable Long id) {
        var u = usuarioRepository.findById(id).orElse(null);
        if (u == null || u.getRol() != Rol.PROFESOR)
            return ResponseEntity.notFound().build();
        u.setActivo(!u.isActivo());
        usuarioRepository.save(u);
        return ResponseEntity.ok(Map.of("activo", u.isActivo()));
    }

    /** Elimina un profesor */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        var u = usuarioRepository.findById(id).orElse(null);
        if (u == null || u.getRol() != Rol.PROFESOR)
            return ResponseEntity.notFound().build();
        usuarioRepository.delete(u);
        return ResponseEntity.ok(Map.of("mensaje", "Profesor eliminado."));
    }
}
