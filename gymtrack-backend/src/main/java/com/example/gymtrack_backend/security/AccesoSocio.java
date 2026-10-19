package com.example.gymtrack_backend.security;

import com.example.gymtrack_backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Reglas de pertenencia para los socios.
 *
 * El staff (ADMIN / PROFESOR) puede ver los datos de cualquier socio.
 * Un SOCIO solo puede ver los suyos: su ID sale siempre del usuario autenticado,
 * nunca de lo que manda el cliente (path, body o header X-Socio-Id).
 *
 * Uso en @PreAuthorize: {@code @PreAuthorize("@acceso.puedeVerSocio(#socioId)")}
 */
@Component("acceso")
@RequiredArgsConstructor
public class AccesoSocio {

    private final SesionesCache sesiones;

    public boolean esStaff() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream().anyMatch(a ->
                a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_PROFESOR"));
    }

    /** ID del socio autenticado, o null si quien llama es staff */
    public Long socioIdActual() {
        if (esStaff()) return null;
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) throw new AccessDeniedException("No autenticado");
        Long socioId = sesiones.datos(auth.getName()).map(SesionesCache.Datos::socioId).orElse(null);
        if (socioId == null) throw new AccessDeniedException("El usuario no está vinculado a un socio");
        return socioId;
    }

    /** true si quien llama es staff o es ese mismo socio */
    public boolean puedeVerSocio(Long socioId) {
        if (esStaff()) return true;
        return socioId != null && socioId.equals(socioIdActual());
    }

    /** Lanza 403 si quien llama no puede ver los datos de ese socio */
    public void verificar(Long socioId) {
        if (!puedeVerSocio(socioId)) throw new AccessDeniedException("No tenés permiso para ver datos de otro socio");
    }

    /**
     * Socio a usar en una operación: para un SOCIO siempre es él mismo (se ignora lo que mande
     * el cliente); para el staff es el que pidió (puede ser null = rutina general / plantilla).
     */
    public Long socioEfectivo(Long socioIdPedido) {
        return esStaff() ? socioIdPedido : socioIdActual();
    }
}
