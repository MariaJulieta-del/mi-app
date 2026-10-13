package com.example.gymtrack_backend.config;

import com.example.gymtrack_backend.entities.Usuario;
import com.example.gymtrack_backend.entities.enums.Rol;
import com.example.gymtrack_backend.repository.UsuarioRepository;
import com.example.gymtrack_backend.security.PoliticaPassword;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Crea el primer administrador cuando la base está vacía (por ejemplo, Supabase recién creada).
 * Usa ADMIN_USERNAME (por defecto "admin") y ADMIN_PASSWORD. Si ya hay un admin, no hace nada.
 * Después de entrar por primera vez conviene borrar ADMIN_PASSWORD de las variables de entorno.
 */
@Component
@RequiredArgsConstructor
public class AdminInicial implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminInicial.class);

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.username:admin}")
    private String username;

    @Value("${app.admin.password:}")
    private String password;

    @Override
    public void run(ApplicationArguments args) {
        if (!usuarioRepository.findByRol(Rol.ADMIN).isEmpty()) return;
        if (password == null || password.isBlank()) {
            log.warn("No hay ningún administrador. Definí ADMIN_PASSWORD para crear el primero.");
            return;
        }
        String error = PoliticaPassword.validar(password);
        if (error != null) {
            log.error("ADMIN_PASSWORD no cumple los requisitos: {}", error);
            return;
        }
        Usuario u = new Usuario();
        u.setUsername(username);
        u.setPassword(passwordEncoder.encode(password));
        u.setRol(Rol.ADMIN);
        u.setActivo(true);
        usuarioRepository.save(u);
        log.info("Administrador inicial '{}' creado.", username);
    }
}
