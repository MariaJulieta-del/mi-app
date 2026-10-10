package com.example.gymtrack_backend.web;

import com.example.gymtrack_backend.backup.BackupService;
import com.example.gymtrack_backend.entities.RegistroBackup;
import com.example.gymtrack_backend.repository.RegistroBackupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

/** PB-20: copias de seguridad de la base (solo admin) */
@RestController
@RequestMapping("/api/v1/backups")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class BackupController {

    private final BackupService service;
    private final RegistroBackupRepository repo;

    public record Copia(Long id, LocalDateTime fecha, String archivo, String destino, Long tamano, Integer tablas, Long filas,
                        Long duracionMs, String estado, String error, boolean manual, boolean disponible) {}

    public record Estado(boolean habilitado, String destino, String destinoDescripcion, boolean efimero, int cadaHoras,
                         int retener, LocalDateTime proxima, List<Copia> copias) {}

    @GetMapping
    public Estado estado() {
        Set<String> disponibles = service.disponibles();
        List<Copia> copias = repo.findTop30ByOrderByFechaDesc().stream().map(r -> copia(r, disponibles)).toList();
        var a = service.almacen();
        return new Estado(service.habilitado(), a.codigo(), a.descripcion(), a.efimero(), service.cadaHoras(),
                service.retener(), service.proxima(), copias);
    }

    /** Hacer una copia ahora */
    @PostMapping
    public Copia ahora() {
        RegistroBackup r = service.ejecutar(true);
        return copia(r, service.disponibles());
    }

    /** Descargar el .zip de una copia */
    @GetMapping("/{id}/archivo")
    public ResponseEntity<InputStreamResource> descargar(@PathVariable Long id) throws IOException {
        RegistroBackup r = repo.findById(id).orElseThrow(() -> new RecursoNoEncontradoException("Copia no encontrada"));
        if (!RegistroBackup.OK.equals(r.getEstado()) || r.getArchivo() == null || !service.disponibles().contains(r.getArchivo())) {
            throw new RecursoNoEncontradoException("Esa copia ya no está guardada (se borran las más viejas)");
        }
        return ResponseEntity.ok()
                .contentType(MediaType.valueOf("application/zip"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + r.getArchivo() + "\"")
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(new InputStreamResource(service.abrir(r.getArchivo())));
    }

    private static Copia copia(RegistroBackup r, Set<String> disponibles) {
        return new Copia(r.getId(), r.getFecha(), r.getArchivo(), r.getDestino(), r.getTamano(), r.getTablas(), r.getFilas(),
                r.getDuracionMs(), r.getEstado(), r.getError(), Boolean.TRUE.equals(r.getManual()),
                r.getArchivo() != null && disponibles.contains(r.getArchivo()));
    }
}
