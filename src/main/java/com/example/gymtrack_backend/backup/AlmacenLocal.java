package com.example.gymtrack_backend.backup;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.util.List;
import java.util.stream.Stream;

/** Carpeta del servidor (sirve en una PC o un VPS; en Render se borra en cada reinicio) */
public class AlmacenLocal implements AlmacenBackups {

    private final Path dir;
    private final boolean efimero;

    public AlmacenLocal(String dir, boolean efimero) {
        this.dir = Paths.get(dir).toAbsolutePath().normalize();
        this.efimero = efimero;
    }

    @Override public String codigo() { return "LOCAL"; }
    @Override public String descripcion() { return "Carpeta del servidor (" + dir + ")"; }
    @Override public boolean efimero() { return efimero; }

    @Override
    public void guardar(String archivo, Path origen) throws IOException {
        Files.createDirectories(dir);
        Files.copy(origen, ruta(archivo), StandardCopyOption.REPLACE_EXISTING);
    }

    @Override
    public List<String> listar() throws IOException {
        if (!Files.isDirectory(dir)) return List.of();
        try (Stream<Path> s = Files.list(dir)) {
            return s.map(p -> p.getFileName().toString()).filter(BackupService::esNombreValido).sorted().toList();
        }
    }

    @Override
    public InputStream abrir(String archivo) throws IOException {
        return Files.newInputStream(ruta(archivo));
    }

    @Override
    public void borrar(String archivo) throws IOException {
        Files.deleteIfExists(ruta(archivo));
    }

    /** Solo nombres generados por el backup (nada de ../ ni rutas) */
    private Path ruta(String archivo) {
        if (!BackupService.esNombreValido(archivo)) throw new IllegalArgumentException("Archivo inválido");
        return dir.resolve(archivo);
    }
}
