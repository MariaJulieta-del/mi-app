package com.example.gymtrack_backend.backup;

import com.example.gymtrack_backend.entities.RegistroBackup;
import com.example.gymtrack_backend.repository.RegistroBackupRepository;
import com.example.gymtrack_backend.service.EmailService;
import org.postgresql.PGConnection;
import org.postgresql.copy.CopyManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.*;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * PB-20: copia de seguridad automática de la base de datos.
 *
 * Arma un .zip con un CSV por tabla (COPY de PostgreSQL, todo en una misma foto consistente de la base),
 * un manifest.json (fecha, versión del esquema, filas por tabla) y restaurar.sql para volver a cargarla con psql.
 * Lo guarda en Supabase Storage (si está configurado) o en una carpeta del servidor, y conserva las últimas N.
 *
 * Cuándo corre: cada hora se fija si pasaron más de BACKUP_CADA_HORAS (24) desde la última copia buena.
 * Así, aunque el servidor haya estado dormido (Render gratis), la copia sale apenas se despierta.
 */
@Service
public class BackupService {

    private static final Logger log = LoggerFactory.getLogger(BackupService.class);
    private static final Pattern NOMBRE = Pattern.compile("^gymtrack-backup-\\d{8}-\\d{6}\\.zip$");
    private static final DateTimeFormatter SELLO = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss");
    /** No se copian: el esquema lo crea Flyway y las sesiones cerradas no hacen falta */
    private static final Set<String> EXCLUIDAS = Set.of("flyway_schema_history", "tokens_revocados");

    private final DataSource dataSource;
    private final RegistroBackupRepository registroRepo;
    private final EmailService emailService;
    private final AlmacenBackups almacen;
    private final boolean habilitado;
    private final int cadaHoras;
    private final int retener;
    private final String avisoMail;

    public BackupService(DataSource dataSource, RegistroBackupRepository registroRepo, EmailService emailService,
                         @Value("${backup.habilitado:true}") boolean habilitado,
                         @Value("${backup.cada-horas:24}") int cadaHoras,
                         @Value("${backup.retener:14}") int retener,
                         @Value("${backup.dir:backups}") String dir,
                         @Value("${backup.supabase.url:}") String supabaseUrl,
                         @Value("${backup.supabase.key:}") String supabaseKey,
                         @Value("${backup.supabase.bucket:backups}") String bucket,
                         @Value("${backup.aviso-mail:}") String avisoMail,
                         @Value("${app.produccion:false}") boolean produccion) {
        this.dataSource = dataSource;
        this.registroRepo = registroRepo;
        this.emailService = emailService;
        this.habilitado = habilitado;
        this.cadaHoras = Math.max(1, cadaHoras);
        this.retener = Math.max(1, retener);
        this.avisoMail = avisoMail == null ? "" : avisoMail.trim();
        this.almacen = !supabaseUrl.isBlank() && !supabaseKey.isBlank()
                ? new AlmacenSupabase(supabaseUrl, supabaseKey, bucket)
                : new AlmacenLocal(dir, produccion);
    }

    public static boolean esNombreValido(String nombre) {
        return nombre != null && NOMBRE.matcher(nombre).matches();
    }

    public AlmacenBackups almacen() { return almacen; }
    public boolean habilitado() { return habilitado; }
    public int cadaHoras() { return cadaHoras; }
    public int retener() { return retener; }

    /** Cada hora (y 2 minutos después de arrancar): si toca, hace la copia */
    @Scheduled(initialDelayString = "PT2M", fixedDelayString = "PT1H")
    public void siCorresponde() {
        if (!habilitado) return;
        Optional<RegistroBackup> ultima = registroRepo.findFirstByEstadoOrderByFechaDesc(RegistroBackup.OK);
        if (ultima.isPresent() && ultima.get().getFecha().isAfter(LocalDateTime.now().minusHours(cadaHoras).plusMinutes(10))) return;
        ejecutar(false);
    }

    /** Hace la copia ahora. Devuelve el registro (OK o ERROR) */
    public synchronized RegistroBackup ejecutar(boolean manual) {
        long inicio = System.currentTimeMillis();
        LocalDateTime ahora = LocalDateTime.now();
        String archivo = "gymtrack-backup-" + ahora.format(SELLO) + ".zip";
        RegistroBackup r = new RegistroBackup();
        r.setFecha(ahora);
        r.setDestino(almacen.codigo());
        r.setManual(manual);
        Path tmp = null;
        try {
            tmp = Files.createTempFile("gymtrack-backup-", ".zip");
            Map<String, Long> filas = volcar(tmp, ahora);
            almacen.guardar(archivo, tmp);
            r.setArchivo(archivo);
            r.setTamano(Files.size(tmp));
            r.setTablas(filas.size());
            r.setFilas(filas.values().stream().mapToLong(Long::longValue).sum());
            r.setEstado(RegistroBackup.OK);
            log.info("Backup {}: {} tablas, {} filas, {} KB en {}", archivo, r.getTablas(), r.getFilas(), r.getTamano() / 1024, almacen.codigo());
            podar();
        } catch (Exception e) {
            r.setEstado(RegistroBackup.ERROR);
            String detalle = e.getClass().getSimpleName() + (e.getMessage() == null ? "" : ": " + e.getMessage());
            r.setError(detalle.length() > 480 ? detalle.substring(0, 480) : detalle);
            log.error("Backup fallido: {}", detalle, e);
            avisarFalla(r);
        } finally {
            if (tmp != null) try { Files.deleteIfExists(tmp); } catch (IOException ignored) { /* temporal */ }
            r.setDuracionMs(System.currentTimeMillis() - inicio);
        }
        return registroRepo.save(r);
    }

    /** Vuelca todas las tablas a un zip. Devuelve filas por tabla */
    Map<String, Long> volcar(Path destino, LocalDateTime fecha) throws SQLException, IOException {
        Map<String, Long> filas = new LinkedHashMap<>();
        StringBuilder restaurar = new StringBuilder();
        StringBuilder secuencias = new StringBuilder();
        String version;
        try (Connection con = dataSource.getConnection()) {
            boolean auto = con.getAutoCommit();
            con.setAutoCommit(false);
            // Una sola foto de la base: todas las tablas coherentes entre sí aunque haya gente usando la app
            try (Statement st = con.createStatement()) {
                st.execute("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY");
            }
            try (ZipOutputStream zip = new ZipOutputStream(new BufferedOutputStream(Files.newOutputStream(destino)), StandardCharsets.UTF_8)) {
                CopyManager copy = con.unwrap(PGConnection.class).getCopyAPI();
                version = versionEsquema(con);
                List<String> tablas = tablas(con);
                restaurar.append(encabezadoRestaurar(fecha, version))
                        .append("TRUNCATE ").append(String.join(", ", tablas.stream().map(t -> "public." + q(t)).toList()))
                        .append(" RESTART IDENTITY CASCADE;\n\n");
                OutputStream sinCerrar = new FilterOutputStream(zip) {
                    @Override public void write(byte[] b, int off, int len) throws IOException { out.write(b, off, len); }
                    @Override public void close() { /* lo cierra el zip */ }
                };
                for (String t : tablas) {
                    List<String> cols = columnas(con, t);
                    zip.putNextEntry(new ZipEntry("datos/" + t + ".csv"));
                    long n = copy.copyOut("COPY public." + q(t) + " TO STDOUT WITH (FORMAT csv, HEADER true)", sinCerrar);
                    zip.closeEntry();
                    filas.put(t, n);
                    restaurar.append("\\copy public.").append(q(t)).append(" (")
                            .append(String.join(", ", cols.stream().map(BackupService::q).toList()))
                            .append(") FROM 'datos/").append(t).append(".csv' WITH (FORMAT csv, HEADER true)\n");
                    if (cols.contains("id") && tieneSecuencia(con, t)) {
                        secuencias.append("SELECT setval(pg_get_serial_sequence('public.").append(q(t)).append("', 'id'), ")
                                .append("COALESCE((SELECT max(id) FROM public.").append(q(t)).append("), 1), ")
                                .append("(SELECT max(id) IS NOT NULL FROM public.").append(q(t)).append("));\n");
                    }
                }
                restaurar.append("\n-- Que los próximos registros sigan la numeración\n").append(secuencias)
                        .append("\nSET session_replication_role = DEFAULT;\nCOMMIT;\n");
                texto(zip, "restaurar.sql", restaurar.toString());
                texto(zip, "manifest.json", manifest(fecha, version, filas));
                texto(zip, "LEEME.txt", leeme(version));
            }
            con.commit();
            con.setAutoCommit(auto);
        }
        return filas;
    }

    /** Borra las copias más viejas, dejando las últimas N */
    private void podar() {
        try {
            List<String> todas = new ArrayList<>(almacen.listar());
            Collections.sort(todas);
            for (int i = 0; i < todas.size() - retener; i++) almacen.borrar(todas.get(i));
        } catch (Exception e) {
            log.warn("No se pudieron borrar copias viejas: {}", e.getMessage());
        }
    }

    private void avisarFalla(RegistroBackup r) {
        if (avisoMail.isEmpty()) return;
        // Un mail por racha de fallas (si la anterior también falló, ya se avisó)
        boolean anteriorFallo = registroRepo.findFirstByOrderByFechaDesc().map(x -> RegistroBackup.ERROR.equals(x.getEstado())).orElse(false);
        if (anteriorFallo) return;
        emailService.enviar(avisoMail, "GymTrack: falló la copia de seguridad",
                "La copia de seguridad automática de la base falló el " + r.getFecha().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))
                        + ".\n\nDetalle: " + r.getError() + "\n\nSe vuelve a intentar cada hora. Podés verlo en Gimnasio › Copias de seguridad.");
    }

    // ── Archivos de las copias (para descargar) ──

    public InputStream abrir(String archivo) throws IOException {
        return almacen.abrir(archivo);
    }

    public Set<String> disponibles() {
        try { return new HashSet<>(almacen.listar()); }
        catch (Exception e) { log.warn("No se pudo listar las copias: {}", e.getMessage()); return Set.of(); }
    }

    // ── Ayudantes ──

    private static List<String> tablas(Connection con) throws SQLException {
        List<String> t = new ArrayList<>();
        try (Statement st = con.createStatement();
             ResultSet rs = st.executeQuery("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename")) {
            while (rs.next()) if (!EXCLUIDAS.contains(rs.getString(1))) t.add(rs.getString(1));
        }
        return t;
    }

    private static List<String> columnas(Connection con, String tabla) throws SQLException {
        List<String> c = new ArrayList<>();
        try (PreparedStatement ps = con.prepareStatement(
                "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = ? ORDER BY ordinal_position")) {
            ps.setString(1, tabla);
            try (ResultSet rs = ps.executeQuery()) { while (rs.next()) c.add(rs.getString(1)); }
        }
        return c;
    }

    private static boolean tieneSecuencia(Connection con, String tabla) throws SQLException {
        try (PreparedStatement ps = con.prepareStatement("SELECT pg_get_serial_sequence(?, 'id')")) {
            ps.setString(1, "public." + q(tabla));
            try (ResultSet rs = ps.executeQuery()) { return rs.next() && rs.getString(1) != null; }
        }
    }

    private static String versionEsquema(Connection con) {
        try (Statement st = con.createStatement();
             ResultSet rs = st.executeQuery("SELECT version FROM flyway_schema_history WHERE success ORDER BY installed_rank DESC LIMIT 1")) {
            return rs.next() ? rs.getString(1) : "?";
        } catch (SQLException e) {
            return "?";
        }
    }

    /** Nombre de tabla o columna entre comillas */
    static String q(String id) {
        return "\"" + id.replace("\"", "\"\"") + "\"";
    }

    private static void texto(ZipOutputStream zip, String nombre, String contenido) throws IOException {
        zip.putNextEntry(new ZipEntry(nombre));
        zip.write(contenido.getBytes(StandardCharsets.UTF_8));
        zip.closeEntry();
    }

    private static String manifest(LocalDateTime fecha, String version, Map<String, Long> filas) {
        StringBuilder sb = new StringBuilder("{\n  \"app\": \"GymTrack\",\n  \"fecha\": \"").append(fecha.withNano(0))
                .append("\",\n  \"versionEsquema\": \"").append(version).append("\",\n  \"tablas\": {");
        int i = 0;
        for (Map.Entry<String, Long> e : filas.entrySet()) {
            sb.append(i++ == 0 ? "\n" : ",\n").append("    \"").append(e.getKey()).append("\": ").append(e.getValue());
        }
        return sb.append("\n  }\n}\n").toString();
    }

    private static String encabezadoRestaurar(LocalDateTime fecha, String version) {
        return "-- Restauración de la copia de GymTrack del " + fecha.withNano(0) + " (esquema V" + version + ")\n"
                + "-- Correr con psql DESDE LA CARPETA DESCOMPRIMIDA, contra una base con el esquema en la misma versión\n"
                + "-- (levantar el backend una vez contra la base vacía: Flyway crea las tablas). Ver LEEME.txt.\n"
                + "-- ATENCIÓN: borra lo que haya en la base de destino y lo reemplaza por la copia.\n\n"
                + "\\set ON_ERROR_STOP on\n"
                + "BEGIN;\n"
                + "-- Sin controlar las claves foráneas mientras se carga (hay referencias cruzadas entre tablas)\n"
                + "SET session_replication_role = replica;\n\n";
    }

    private static String leeme(String version) {
        return """
                COPIA DE SEGURIDAD DE GYMTRACK
                ==============================

                Contenido
                  datos/*.csv     una tabla por archivo (con encabezado)
                  manifest.json   fecha, versión del esquema (V%s) y filas por tabla
                  restaurar.sql   script para volver a cargar todo con psql

                Contiene datos personales de los socios y las contraseñas cifradas del staff:
                guardala en un lugar privado.

                Cómo restaurar
                  1. Crear una base vacía (o usar la de Supabase, sabiendo que se reemplaza todo).
                  2. Levantar el backend una vez apuntando a esa base: Flyway crea las tablas.
                     Tiene que ser la misma versión del sistema (esquema V%s) con la que se hizo la copia.
                  3. Apagar el backend, descomprimir este zip y, DESDE ESTA CARPETA, correr:
                       psql "postgresql://USUARIO:CLAVE@HOST:5432/BASE" -f restaurar.sql
                     (en Supabase usar la conexión directa, puerto 5432, con el usuario postgres)
                  4. Volver a levantar el backend.

                Si algo falla, el script se detiene y no cambia nada (todo va en una transacción).
                """.formatted(version, version);
    }

    /** Para mostrar cuánto falta para la próxima copia */
    public LocalDateTime proxima() {
        return registroRepo.findFirstByEstadoOrderByFechaDesc(RegistroBackup.OK)
                .map(r -> r.getFecha().plus(Duration.ofHours(cadaHoras)))
                .orElse(LocalDateTime.now());
    }
}
