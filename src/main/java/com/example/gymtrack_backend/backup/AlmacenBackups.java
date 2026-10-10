package com.example.gymtrack_backend.backup;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;
import java.util.List;

/** Dónde se guardan las copias de seguridad */
public interface AlmacenBackups {

    /** LOCAL o SUPABASE */
    String codigo();

    /** Descripción para el admin */
    String descripcion();

    /** true si los archivos se pierden al reiniciar el servidor (disco de Render) */
    boolean efimero();

    void guardar(String archivo, Path origen) throws IOException;

    /** Nombres de los archivos guardados */
    List<String> listar() throws IOException;

    InputStream abrir(String archivo) throws IOException;

    void borrar(String archivo) throws IOException;
}
