package com.example.gymtrack_backend.web;

import com.example.gymtrack_backend.entities.ConfiguracionGimnasio;
import com.example.gymtrack_backend.repository.ConfiguracionGimnasioRepository;
import com.example.gymtrack_backend.service.EmailService;
import com.example.gymtrack_backend.service.RecordatorioCuotaService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/** PB-17: configuración e historial de los recordatorios automáticos de vencimiento (solo admin) */
@RestController
@RequestMapping("/api/v1/recordatorios-cuota")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class RecordatorioCuotaController {

    private final RecordatorioCuotaService service;
    private final ConfiguracionGimnasioRepository configRepo;
    private final EmailService emailService;

    public record Config(boolean activo, int dias, boolean porMail, boolean avisarVencida, boolean mailListo) {}
    public record Estado(Config config, List<RecordatorioCuotaService.Enviado> ultimos) {}
    /** Lo que se puede cambiar (lo que no venga, queda como estaba) */
    public record Cambios(Boolean activo, Integer dias, Boolean porMail, Boolean avisarVencida) {}

    @GetMapping
    public Estado estado() {
        return new Estado(config(actual()), service.ultimos(30));
    }

    @PutMapping
    public Config guardar(@RequestBody Cambios body) {
        if (body.dias() != null && (body.dias() < RecordatorioCuotaService.DIAS_MIN || body.dias() > RecordatorioCuotaService.DIAS_MAX)) {
            throw new IllegalArgumentException("Elegí entre " + RecordatorioCuotaService.DIAS_MIN + " y " + RecordatorioCuotaService.DIAS_MAX + " días de anticipación");
        }
        ConfiguracionGimnasio c = actual();
        if (body.activo() != null) c.setRecordatorioActivo(body.activo());
        if (body.dias() != null) c.setRecordatorioDias(body.dias());
        if (body.porMail() != null) c.setRecordatorioMail(body.porMail());
        if (body.avisarVencida() != null) c.setRecordatorioVencida(body.avisarVencida());
        c.setActualizado(LocalDateTime.now());
        configRepo.save(c);
        return config(c);
    }

    /** Mandar ahora los que correspondan (los que ya se mandaron no se repiten) */
    @PostMapping("/ejecutar")
    public RecordatorioCuotaService.Resultado ejecutar() {
        return service.ejecutar();
    }

    private Config config(ConfiguracionGimnasio c) {
        return new Config(Boolean.TRUE.equals(c.getRecordatorioActivo()), c.getRecordatorioDias() == null ? 3 : c.getRecordatorioDias(),
                Boolean.TRUE.equals(c.getRecordatorioMail()), Boolean.TRUE.equals(c.getRecordatorioVencida()), emailService.habilitado());
    }

    private ConfiguracionGimnasio actual() {
        return configRepo.findById(ConfiguracionGimnasio.ID).orElseGet(() -> configRepo.save(new ConfiguracionGimnasio()));
    }
}
