package com.example.gymtrack_backend.backup;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Bucket privado de Supabase Storage (fuera del servidor: sobrevive a reinicios y a la caída de Render).
 * Usa la clave service_role, que solo vive en las variables de entorno del backend.
 */
public class AlmacenSupabase implements AlmacenBackups {

    private final RestClient http;
    private final String bucket;

    public AlmacenSupabase(String url, String clave, String bucket) {
        this.bucket = bucket;
        this.http = RestClient.builder()
                .baseUrl(url.replaceAll("/+$", "") + "/storage/v1")
                .defaultHeader("Authorization", "Bearer " + clave)
                .defaultHeader("apikey", clave)
                .build();
    }

    @Override public String codigo() { return "SUPABASE"; }
    @Override public String descripcion() { return "Supabase Storage (bucket privado \"" + bucket + "\")"; }
    @Override public boolean efimero() { return false; }

    @Override
    public void guardar(String archivo, Path origen) {
        http.post().uri("/object/{bucket}/{archivo}", bucket, validar(archivo))
                .contentType(MediaType.valueOf("application/zip"))
                .header("x-upsert", "true")
                .body(new FileSystemResource(origen))
                .retrieve().toBodilessEntity();
    }

    @Override
    public List<String> listar() {
        List<Map<String, Object>> r = http.post().uri("/object/list/{bucket}", bucket)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("prefix", "", "limit", 1000, "offset", 0, "sortBy", Map.of("column", "name", "order", "asc")))
                .retrieve().body(new ParameterizedTypeReference<List<Map<String, Object>>>() {});
        List<String> nombres = new ArrayList<>();
        if (r != null) r.forEach(n -> { Object nom = n.get("name"); if (nom instanceof String x && BackupService.esNombreValido(x)) nombres.add(x); });
        nombres.sort(null);
        return nombres;
    }

    @Override
    public InputStream abrir(String archivo) throws IOException {
        byte[] datos = http.get().uri("/object/{bucket}/{archivo}", bucket, validar(archivo)).retrieve().body(byte[].class);
        if (datos == null) throw new IOException("Archivo vacío");
        return new ByteArrayInputStream(datos);
    }

    @Override
    public void borrar(String archivo) {
        http.method(org.springframework.http.HttpMethod.DELETE).uri("/object/{bucket}", bucket)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("prefixes", List.of(validar(archivo))))
                .retrieve().toBodilessEntity();
    }

    private static String validar(String archivo) {
        if (!BackupService.esNombreValido(archivo)) throw new IllegalArgumentException("Archivo inválido");
        return archivo;
    }
}
