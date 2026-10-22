package com.example.gymtrack_backend.demo;

import com.example.gymtrack_backend.security.SesionesCache;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.io.InputStream;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.zip.GZIPInputStream;

/**
 * Demo pública: deja la base con los datos de prueba cada vez que arranca el servidor y todas las madrugadas,
 * así lo que tocan los visitantes no se acumula. Las fechas se corren para que "hoy" de los datos sea hoy.
 * Solo actúa con DEMO_MODE=true.
 */
@Component
@RequiredArgsConstructor
public class DemoReset {

    private static final Logger log = LoggerFactory.getLogger(DemoReset.class);
    private static final ZoneId ZONA = ZoneId.of("America/Argentina/Cordoba");

    private final DemoConfig demo;
    private final DataSource dataSource;
    private final SesionesCache sesiones;

    @EventListener(ApplicationReadyEvent.class)
    public void alArrancar() {
        if (demo.habilitada()) recargar();
    }

    @Scheduled(cron = "0 0 5 * * *", zone = "America/Argentina/Cordoba")
    public void todasLasMadrugadas() {
        if (demo.habilitada()) recargar();
    }

    public synchronized void recargar() {
        long t0 = System.currentTimeMillis();
        try (Connection c = dataSource.getConnection()) {
            c.setAutoCommit(false);
            try (Statement st = c.createStatement()) {
                // 1 · Vaciar todas las tablas (menos el historial de migraciones)
                List<String> tablas = new ArrayList<>();
                try (ResultSet rs = st.executeQuery("SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> 'flyway_schema_history'")) {
                    while (rs.next()) tablas.add("\"" + rs.getString(1) + "\"");
                }
                if (!tablas.isEmpty()) st.execute("TRUNCATE " + String.join(", ", tablas) + " RESTART IDENTITY CASCADE");

                // 2 · Cargar los datos de prueba. Hay claves foráneas circulares (socios, usuarios, disciplinas):
                //     se sacan mientras se carga y se vuelven a crear igual que estaban.
                List<String[]> fks = new ArrayList<>();
                try (ResultSet rs = st.executeQuery("SELECT conrelid::regclass::text, conname, pg_get_constraintdef(oid) FROM pg_constraint "
                        + "WHERE contype = 'f' AND connamespace = 'public'::regnamespace")) {
                    while (rs.next()) fks.add(new String[]{rs.getString(1), rs.getString(2), rs.getString(3)});
                }
                for (String[] fk : fks) st.execute("ALTER TABLE " + fk[0] + " DROP CONSTRAINT \"" + fk[1] + "\"");
                try (InputStream in = new GZIPInputStream(new ClassPathResource("demo/datos.sql.gz").getInputStream())) {
                    byte[] sql = in.readAllBytes();
                    ScriptUtils.executeSqlScript(c, new org.springframework.core.io.ByteArrayResource(sql));
                }
                for (String[] fk : fks) st.execute("ALTER TABLE " + fk[0] + " ADD CONSTRAINT \"" + fk[1] + "\" " + fk[2]);

                // 3 · Correr todas las fechas: el "hoy" de los datos pasa a ser hoy
                LocalDate base = LocalDate.parse(leerFechaBase());
                long dias = ChronoUnit.DAYS.between(base, LocalDate.now(ZONA));
                if (dias != 0) {
                    Map<String, List<String[]>> columnas = new LinkedHashMap<>();
                    try (ResultSet rs = st.executeQuery("SELECT table_name, column_name, data_type FROM information_schema.columns "
                            + "WHERE table_schema = 'public' AND table_name <> 'flyway_schema_history' "
                            + "AND data_type IN ('date', 'timestamp without time zone', 'timestamp with time zone')")) {
                        while (rs.next()) columnas.computeIfAbsent(rs.getString(1), k -> new ArrayList<>()).add(new String[]{rs.getString(2), rs.getString(3)});
                    }
                    // En dos pasos (primero muy adelante y después al día justo): hay fechas únicas (un cierre de caja
                    // por día) y correrlas de a una chocaría con la fila siguiente.
                    final long LEJOS = 100000;
                    for (long paso : new long[]{dias + LEJOS, -LEJOS}) {
                        for (var e : columnas.entrySet()) {
                            StringJoiner set = new StringJoiner(", ");
                            for (String[] col : e.getValue()) {
                                String n = "\"" + col[0] + "\"";
                                set.add(n + " = " + n + ("date".equals(col[1]) ? " + (" + paso + ")" : " + interval '" + paso + " days'"));
                            }
                            st.execute("UPDATE \"" + e.getKey() + "\" SET " + set);
                        }
                    }
                }
                // 4 · El PIN de los socios queda "cambiado" en el pasado (si no, las sesiones nuevas se rechazarían)
                st.execute("UPDATE usuarios SET pin_actualizado = LEAST(pin_actualizado, now() - interval '1 day') WHERE pin_actualizado IS NOT NULL");
                c.commit();
                sesiones.olvidarTodo();
                log.info("[Demo] Datos de prueba recargados (fechas corridas {} días) en {} ms", dias, System.currentTimeMillis() - t0);
            } catch (Exception ex) {
                c.rollback();
                throw ex;
            }
        } catch (Exception ex) {
            log.error("[Demo] No se pudieron recargar los datos de prueba", ex);
        }
    }

    private String leerFechaBase() throws java.io.IOException {
        try (InputStream in = new ClassPathResource("demo/fecha-base.txt").getInputStream()) {
            return new String(in.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8).trim();
        }
    }
}
