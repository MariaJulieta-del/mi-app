package com.example.gymtrack_backend.security;

import com.example.gymtrack_backend.entities.Usuario;
import com.example.gymtrack_backend.repository.TokenRevocadoRepository;
import com.example.gymtrack_backend.repository.UsuarioRepository;
import jakarta.persistence.PostPersist;
import jakarta.persistence.PostRemove;
import jakarta.persistence.PostUpdate;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Lo que se consulta en cada pedido para validar la sesión (el usuario, si su socio sigue activo,
 * si el token se cerró) queda en memoria un rato, así no se va a la base en cada pedido.
 *
 * - Cualquier cambio en un usuario o un socio (baja, contraseña, PIN, desactivar) borra la memoria
 *   en el momento (ver {@link Oyente}): el cambio rige enseguida, igual que antes.
 * - Cerrar sesión marca el token como cerrado en el momento.
 * - Hay una sola instancia del backend (Render): la memoria es la misma para todos los pedidos.
 */
@Component
public class SesionesCache {

    /** Cuánto se recuerda un usuario sin volver a la base */
    static final long TTL_USUARIO_MS = 60_000;
    /** Cuánto se recuerda que un token NO fue cerrado */
    static final long TTL_TOKEN_MS = 300_000;
    private static final int MAX_ENTRADAS = 5_000;

    private static volatile SesionesCache instancia;

    /** Usuario de la sesión con su socio ya resuelto (id y si sigue activo) */
    public record Datos(Usuario usuario, Long socioId, boolean socioActivo, long hasta) {}

    private final UsuarioRepository usuarios;
    private final TokenRevocadoRepository revocados;
    private final ConcurrentHashMap<String, Datos> porUsuario = new ConcurrentHashMap<>();
    /** jti → hasta cuándo se lo da por no cerrado */
    private final ConcurrentHashMap<String, Long> tokensAbiertos = new ConcurrentHashMap<>();

    public SesionesCache(UsuarioRepository usuarios, TokenRevocadoRepository revocados) {
        this.usuarios = usuarios;
        this.revocados = revocados;
        instancia = this;
    }

    public Optional<Datos> datos(String username) {
        long ahora = System.currentTimeMillis();
        // En la demo pública cada visitante tiene su copia de los datos: no se mezclan en la memoria
        String clave = com.example.gymtrack_backend.demo.DemoContexto.clave(username);
        Datos d = porUsuario.get(clave);
        if (d != null && d.hasta() > ahora) return Optional.of(d);
        Optional<Usuario> u = usuarios.findConSocioByUsername(username);
        if (u.isEmpty()) {
            porUsuario.remove(clave);
            return Optional.empty();
        }
        var socio = u.get().getSocio();
        Datos nuevo = new Datos(u.get(), socio == null ? null : socio.getId(),
                socio != null && Boolean.TRUE.equals(socio.getActivo()), ahora + TTL_USUARIO_MS);
        if (porUsuario.size() > MAX_ENTRADAS) porUsuario.clear();
        porUsuario.put(clave, nuevo);
        return Optional.of(nuevo);
    }

    /** ¿Se cerró la sesión de este token? */
    public boolean revocado(String jti) {
        long ahora = System.currentTimeMillis();
        Long hasta = tokensAbiertos.get(jti);
        if (hasta != null && hasta > ahora) return false;
        boolean cerrado = revocados.existsById(jti);
        if (cerrado) {
            tokensAbiertos.remove(jti);
        } else {
            if (tokensAbiertos.size() > MAX_ENTRADAS) tokensAbiertos.clear();
            tokensAbiertos.put(jti, ahora + TTL_TOKEN_MS);
        }
        return cerrado;
    }

    /** Se cerró la sesión: el token deja de valer ya */
    public void cerrado(String jti) {
        tokensAbiertos.remove(jti);
    }

    public void olvidarTodo() {
        porUsuario.clear();
    }

    /** Escucha los cambios de usuarios y socios para que rijan enseguida */
    public static class Oyente {
        @PostPersist
        @PostUpdate
        @PostRemove
        void cambio(Object entidad) {
            SesionesCache c = instancia;
            if (c != null) c.olvidarTodo();
        }
    }
}
