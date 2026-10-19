package com.example.gymtrack_backend.service;

import com.example.gymtrack_backend.entities.ConfiguracionGimnasio;
import com.example.gymtrack_backend.entities.Rutina;
import com.example.gymtrack_backend.repository.ConfiguracionGimnasioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/**
 * Cuánto tiempo puede un socio hacer la misma rutina antes de renovarla.
 * El límite lo define el admin (Configuración › Gimnasio); por defecto, 6 semanas.
 * Se cuenta desde la última vez que el profe cambió los ejercicios (o desde que se creó).
 */
@Component
@RequiredArgsConstructor
public class ReglasRutina {

    public static final int SEMANAS_POR_DEFECTO = 6;
    public static final int SEMANAS_MIN = 2;
    public static final int SEMANAS_MAX = 26;

    private final ConfiguracionGimnasioRepository configRepo;

    public int semanasMax() {
        return configRepo.findById(ConfiguracionGimnasio.ID)
                .map(ConfiguracionGimnasio::getSemanasRutina)
                .filter(s -> s != null && s >= SEMANAS_MIN && s <= SEMANAS_MAX)
                .orElse(SEMANAS_POR_DEFECTO);
    }

    /** Desde cuándo el socio hace esta rutina tal como está */
    public static LocalDateTime inicio(Rutina r) {
        return r.getFechaRenovacion() != null ? r.getFechaRenovacion() : r.getFechaCreacion();
    }

    public static long semanas(Rutina r, LocalDate hoy) {
        return semanas(inicio(r), hoy);
    }

    public static long semanas(LocalDateTime inicio, LocalDate hoy) {
        return inicio == null ? 0 : ChronoUnit.WEEKS.between(inicio.toLocalDate(), hoy);
    }
}
