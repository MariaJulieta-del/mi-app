package com.example.gymtrack_backend.service;

import org.springframework.security.authentication.BadCredentialsException;

import com.example.gymtrack_backend.dto.LoginRequestDTO;
import com.example.gymtrack_backend.dto.LoginResponseDTO;
import com.example.gymtrack_backend.dto.RegisterRequestDTO;
import com.example.gymtrack_backend.entities.Socio;
import com.example.gymtrack_backend.entities.Usuario;
import com.example.gymtrack_backend.entities.enums.Rol;
import com.example.gymtrack_backend.repository.SocioRepository;
import com.example.gymtrack_backend.repository.UsuarioRepository;
import com.example.gymtrack_backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


/**
 * Servicio de autenticación:
 *  - login: valida credenciales y devuelve JWT
 *  - register: crea un nuevo usuario (solo ADMIN puede hacerlo vía controller)
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository      usuarioRepository;
    private final SocioRepository        socioRepository;
    private final PasswordEncoder        passwordEncoder;
    private final JwtUtil                jwtUtil;
    private final AuthenticationManager  authManager;

    // ── Login ────────────────────────────────────────────────────────────────
    public LoginResponseDTO login(LoginRequestDTO dto) {
        // Spring Security valida username + password con BCrypt
        authManager.authenticate(
                new UsernamePasswordAuthenticationToken(dto.getUsername(), dto.getPassword())
        );

        Usuario usuario = usuarioRepository.findByUsername(dto.getUsername())
                .orElseThrow(() -> new BadCredentialsException("Usuario o contraseña incorrectos"));

        // Los socios ingresan solo con DNI + PIN (antes su usuario y contraseña eran el DNI)
        if (usuario.getRol() == Rol.SOCIO) {
            throw new BadCredentialsException("Usuario o contraseña incorrectos");
        }

        // Un socio dado de baja no puede ingresar aunque su usuario siga activo
        if (usuario.getRol() == Rol.SOCIO && usuario.getSocio() != null
                && !Boolean.TRUE.equals(usuario.getSocio().getActivo())) {
            throw new DisabledException("Este socio está dado de baja");
        }

        String token = jwtUtil.generateToken(usuario, usuario.getRol().name());

        Long socioId = (usuario.getSocio() != null) ? usuario.getSocio().getId() : null;

        return new LoginResponseDTO(token, usuario.getUsername(), usuario.getRol().name(), socioId);
    }

    // ── Login socio: DNI + PIN ───────────────────────────────────────────────
    /**
     * Devuelve el token si el DNI y el PIN son correctos. Cualquier falla lanza la misma excepción
     * (sin decir si el DNI existe). Entrar NO registra ingreso: eso se hace escaneando el QR.
     */
    @Transactional(readOnly = true)
    public LoginResponseDTO loginSocio(String dni, String pin) {
        var socio = socioRepository.findByDni(dni).orElse(null);
        var usuario = socio == null ? null : usuarioRepository.findBySocioId(socio.getId()).orElse(null);
        boolean valido = usuario != null
                && usuario.getRol() == Rol.SOCIO
                && usuario.isEnabled()
                && Boolean.TRUE.equals(socio.getActivo())
                && usuario.getPinActualizado() != null
                && pin != null && passwordEncoder.matches(pin, usuario.getPassword());
        if (!valido) {
            // Mismo costo de tiempo aunque el DNI no exista, para no revelar cuáles existen
            if (usuario == null) passwordEncoder.matches(pin == null ? "" : pin, DUMMY_HASH);
            throw new BadCredentialsException("DNI o PIN incorrectos");
        }
        return tokenSocio(usuario);
    }

    /** Token de sesión larga para el socio (queda abierta en su celular) */
    public LoginResponseDTO tokenSocio(Usuario usuario) {
        String token = jwtUtil.generateToken(usuario, Rol.SOCIO.name(), expirationSocioMs);
        return new LoginResponseDTO(token, usuario.getUsername(), Rol.SOCIO.name(), usuario.getSocio().getId());
    }

    /** Hash cualquiera para igualar tiempos cuando el DNI no existe */
    private static final String DUMMY_HASH = "$2a$10$7EqJtq98hPqEX7fNZaFWoOhi5BWX4Z5bDOxQyN6MU/c/rJ5XlyG2u";

    @org.springframework.beans.factory.annotation.Value("${jwt.expiration-socio-ms:2592000000}")
    private long expirationSocioMs;

    // ── Registro ─────────────────────────────────────────────────────────────
    public void register(RegisterRequestDTO dto) {
        String errorPass = com.example.gymtrack_backend.security.PoliticaPassword.validar(dto.getPassword());
        if (errorPass != null) throw new IllegalArgumentException(errorPass);
        if (usuarioRepository.existsByUsername(dto.getUsername())) {
            throw new IllegalArgumentException("El username '" + dto.getUsername() + "' ya está en uso");
        }

        Usuario usuario = new Usuario();
        usuario.setUsername(dto.getUsername());
        // Encriptar contraseña con BCrypt
        usuario.setPassword(passwordEncoder.encode(dto.getPassword()));
        usuario.setEmail(dto.getEmail());

        // Asignar rol (por defecto PROFESOR)
        // Por API solo se crean profesores o usuarios de socio; los admins se crean a mano en la base
        Rol rol;
        try { rol = (dto.getRol() != null) ? Rol.valueOf(dto.getRol().toUpperCase()) : Rol.PROFESOR; }
        catch (IllegalArgumentException e) { throw new IllegalArgumentException("Rol inválido: " + dto.getRol()); }
        if (rol == Rol.ADMIN) throw new IllegalArgumentException("No se pueden crear administradores desde la app");
        usuario.setRol(rol);

        // Vincular a socio si corresponde
        if (dto.getSocioId() != null) {
            Socio socio = socioRepository.findById(dto.getSocioId())
                    .orElseThrow(() -> new RuntimeException("Socio no encontrado: " + dto.getSocioId()));
            usuario.setSocio(socio);
        }

        usuarioRepository.save(usuario);
    }
}
