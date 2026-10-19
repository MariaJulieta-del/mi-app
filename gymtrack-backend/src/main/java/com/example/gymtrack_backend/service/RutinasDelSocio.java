package com.example.gymtrack_backend.service;

import com.example.gymtrack_backend.entities.Rutina;
import com.example.gymtrack_backend.entities.RutinaAsignacion;
import com.example.gymtrack_backend.repository.RutinaAsignacionRepository;
import com.example.gymtrack_backend.repository.RutinaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/**
 * Las rutinas que hace un socio: las personalizadas (suyas) y las plantillas que tiene asignadas.
 * Todo lo que necesita "la rutina actual del socio" (Hoy, retención, pedidos) pasa por acá.
 */
@Component
@RequiredArgsConstructor
public class RutinasDelSocio {

    private final RutinaRepository rutinaRepo;
    private final RutinaAsignacionRepository asignacionRepo;

    /** Una rutina del socio. Si es una plantilla asignada, {@code asignacion} no es null. */
    public record RutinaDeSocio(Rutina rutina, RutinaAsignacion asignacion, LocalDateTime inicio) {
        public boolean asignada() { return asignacion != null; }
    }

    public List<RutinaDeSocio> de(Long socioId) {
        List<RutinaDeSocio> out = new ArrayList<>();
        for (Rutina r : rutinaRepo.findBySocioId(socioId)) out.add(new RutinaDeSocio(r, null, ReglasRutina.inicio(r)));
        for (RutinaAsignacion a : asignacionRepo.deSocio(socioId)) out.add(new RutinaDeSocio(a.getRutina(), a, inicio(a)));
        return out;
    }

    /** La rutina actual de cada uno de varios socios, con dos consultas en total */
    public java.util.Map<Long, RutinaDeSocio> actuales(java.util.Collection<Long> socioIds) {
        java.util.Map<Long, RutinaDeSocio> out = new java.util.HashMap<>();
        if (socioIds.isEmpty()) return out;
        for (Rutina r : rutinaRepo.findBySocioIdIn(socioIds)) {
            quedarseConLaUltima(out, r.getSocio().getId(), new RutinaDeSocio(r, null, ReglasRutina.inicio(r)));
        }
        for (RutinaAsignacion a : asignacionRepo.deSocios(socioIds)) {
            quedarseConLaUltima(out, a.getSocio().getId(), new RutinaDeSocio(a.getRutina(), a, inicio(a)));
        }
        return out;
    }

    private static void quedarseConLaUltima(java.util.Map<Long, RutinaDeSocio> m, Long socioId, RutinaDeSocio x) {
        if (x.inicio() == null) return;
        m.merge(socioId, x, (viejo, nuevo) -> nuevo.inicio().isAfter(viejo.inicio()) ? nuevo : viejo);
    }

    /** La rutina que hace ahora: la que recibió (o le cambiaron) más recientemente */
    public Optional<RutinaDeSocio> actual(Long socioId) {
        return de(socioId).stream().filter(x -> x.inicio() != null).max(Comparator.comparing(RutinaDeSocio::inicio));
    }

    /**
     * Desde cuándo hace una plantilla asignada: desde que se la asignaron, o desde que el profe
     * le cambió los ejercicios a la plantilla si fue después (le llegaron los cambios).
     */
    public static LocalDateTime inicio(RutinaAsignacion a) {
        LocalDateTime asignada = a.getFechaAsignacion();
        LocalDateTime cambio = a.getRutina().getFechaRenovacion();
        return cambio != null && cambio.isAfter(asignada) ? cambio : asignada;
    }

    /** ¿El socio puede usar esta rutina (verla, entrenarla, registrar progreso)? */
    public boolean puedeUsar(Long socioId, Rutina r) {
        if (r == null || socioId == null) return false;
        if (r.getSocio() != null) return r.getSocio().getId().equals(socioId);
        return asignacionRepo.existsByRutinaIdAndSocioId(r.getId(), socioId);
    }
}
