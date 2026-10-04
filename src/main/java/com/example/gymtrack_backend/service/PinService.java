package com.example.gymtrack_backend.service;

import com.example.gymtrack_backend.entities.Socio;
import com.example.gymtrack_backend.entities.Usuario;
import com.example.gymtrack_backend.entities.enums.Rol;
import com.example.gymtrack_backend.repository.SocioRepository;
import com.example.gymtrack_backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * PIN de 4 dígitos de los socios (se ingresa con DNI + PIN).
 *
 * El gimnasio genera el PIN (en el alta o cuando el socio lo pide) y se muestra UNA sola vez
 * para entregárselo. En la base solo queda el hash. El socio puede cambiarlo desde su cuenta.
 */
@Service
@RequiredArgsConstructor
public class PinService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UsuarioRepository usuarioRepository;
    private final SocioRepository   socioRepository;
    private final PasswordEncoder   passwordEncoder;

    /** PIN aleatorio que no sea obvio (0000, 1234, 1111…) */
    public String generarPin() {
        String pin;
        do {
            pin = String.format("%04d", RANDOM.nextInt(10_000));
        } while (esDebil(pin, null));
        return pin;
    }

    /** true si el PIN es fácil de adivinar: repetido, secuencia o parte del DNI */
    public boolean esDebil(String pin, String dni) {
        if (pin == null || !pin.matches("[0-9]{4}")) return true;
        if (pin.chars().distinct().count() == 1) return true;                // 0000, 7777
        boolean asc = true, desc = true;
        for (int i = 1; i < 4; i++) {
            int d = pin.charAt(i) - pin.charAt(i - 1);
            if (d != 1) asc = false;
            if (d != -1) desc = false;
        }
        if (asc || desc) return true;                                        // 1234, 9876
        if (pin.substring(0, 2).equals(pin.substring(2))) return true;      // 1212
        if (dni != null && (dni.startsWith(pin) || dni.endsWith(pin))) return true;
        return pin.equals("2580") || pin.equals("0852");                     // columna del teclado
    }

    /**
     * Asigna un PIN nuevo al socio (crea su usuario si no tenía) y lo devuelve en claro
     * para mostrarlo una única vez. Cierra las sesiones abiertas con el PIN anterior.
     */
    @Transactional
    public String asignarNuevoPin(Long socioId) {
        Socio socio = socioRepository.findById(socioId)
                .orElseThrow(() -> new IllegalArgumentException("Socio no encontrado"));
        if (!Boolean.TRUE.equals(socio.getActivo())) {
            throw new IllegalArgumentException("El socio está dado de baja");
        }
        Usuario u = usuarioRepository.findBySocioId(socioId).orElseGet(() -> {
            if (usuarioRepository.existsByUsername(socio.getDni())) {
                throw new IllegalStateException("Ya existe otro usuario con el DNI " + socio.getDni());
            }
            Usuario nuevo = new Usuario();
            nuevo.setUsername(socio.getDni());
            nuevo.setRol(Rol.SOCIO);
            nuevo.setSocio(socio);
            nuevo.setActivo(true);
            return nuevo;
        });
        String pin = generarPin();
        u.setPassword(passwordEncoder.encode(pin));
        u.setPinActualizado(LocalDateTime.now());
        usuarioRepository.save(u);
        return pin;
    }

    /** El socio cambia su propio PIN. Devuelve el usuario actualizado. */
    @Transactional
    public Usuario cambiarPin(String username, String pinActual, String pinNuevo) {
        Usuario u = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        if (u.getRol() != Rol.SOCIO || u.getPinActualizado() == null
                || !passwordEncoder.matches(pinActual == null ? "" : pinActual, u.getPassword())) {
            throw new IllegalArgumentException("El PIN actual no es correcto");
        }
        String dni = u.getSocio() != null ? u.getSocio().getDni() : null;
        if (esDebil(pinNuevo, dni)) {
            throw new IllegalArgumentException("Elegí otro PIN: tiene que tener 4 números y no ser fácil de adivinar (como 1234, 1111 o parte de tu DNI).");
        }
        u.setPassword(passwordEncoder.encode(pinNuevo));
        u.setPinActualizado(LocalDateTime.now());
        return usuarioRepository.save(u);
    }

    public record PinGenerado(Long socioId, String nombre, String dni, String pin) {}

    /** Genera PIN para todos los socios activos que todavía no tienen (para imprimir y entregar) */
    @Transactional
    public List<PinGenerado> generarPendientes() {
        List<PinGenerado> lista = new ArrayList<>();
        for (Socio s : socioRepository.findByActivoTrue()) {
            Usuario u = usuarioRepository.findBySocioId(s.getId()).orElse(null);
            if (u != null && u.getPinActualizado() != null) continue;
            try {
                lista.add(new PinGenerado(s.getId(), s.getNombre() + " " + s.getApellido(), s.getDni(), asignarNuevoPin(s.getId())));
            } catch (RuntimeException e) {
                // Un caso raro (ej. DNI duplicado con un usuario del staff) no frena al resto
            }
        }
        lista.sort((a, b) -> a.nombre().compareToIgnoreCase(b.nombre()));
        return lista;
    }
}
