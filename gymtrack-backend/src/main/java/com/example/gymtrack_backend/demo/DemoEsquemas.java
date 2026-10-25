package com.example.gymtrack_backend.demo;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.security.SecureRandom;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Demo pública: una copia de los datos de prueba para cada visitante, así lo que carga uno (socios, cobros,
 * reservas…) lo ve solo él y no le cambia la demo al resto. Las copias son esquemas de PostgreSQL que se borran
 * solos al rato de no usarse y todas las madrugadas, cuando se recargan los datos de prueba.
 */
@Component
public class DemoEsquemas {

    private static final Logger log = LoggerFactory.getLogger(DemoEsquemas.class);
    /** Sin usar durante este tiempo, la copia se borra */
    static final long VIDA_SIN_USO_MS = 90 * 60_000L;
    /** Tope de copias a la vez (cuida el espacio de la base gratis) */
    static final int MAXIMO = 80;

    private static final String CLONAR = """
            CREATE OR REPLACE FUNCTION demo_clonar(destino text) RETURNS void LANGUAGE plpgsql AS $f$
            DECLARE t record; c record;
            BEGIN
              PERFORM set_config('search_path', 'public', true);
              EXECUTE format('CREATE SCHEMA %I', destino);
              FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> 'flyway_schema_history' LOOP
                EXECUTE format('CREATE TABLE %I.%I (LIKE public.%I INCLUDING DEFAULTS INCLUDING IDENTITY INCLUDING GENERATED INCLUDING CONSTRAINTS INCLUDING INDEXES)',
                               destino, t.tablename, t.tablename);
                EXECUTE format('INSERT INTO %I.%I OVERRIDING SYSTEM VALUE SELECT * FROM public.%I', destino, t.tablename, t.tablename);
              END LOOP;
              FOR c IN SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = destino AND is_identity = 'YES' LOOP
                EXECUTE format('SELECT setval(pg_get_serial_sequence(%L, %L), COALESCE((SELECT max(%I) FROM %I.%I), 0) + 1, false)',
                               format('%I.%I', destino, c.table_name), c.column_name, c.column_name, destino, c.table_name);
              END LOOP;
              FOR c IN SELECT conrelid::regclass::text AS tabla, conname, pg_get_constraintdef(oid) AS def
                       FROM pg_constraint WHERE contype = 'f' AND connamespace = 'public'::regnamespace LOOP
                EXECUTE format('ALTER TABLE %I.%s ADD CONSTRAINT %I %s', destino, c.tabla, c.conname,
                               regexp_replace(c.def, 'REFERENCES ', 'REFERENCES ' || quote_ident(destino) || '.'));
              END LOOP;
            END $f$""";

    private final DemoConfig demo;
    private final DataSource dataSource;
    private final SecureRandom azar = new SecureRandom();
    /** Copias existentes → último uso */
    private final Map<String, Long> usadas = new ConcurrentHashMap<>();
    private volatile boolean funcionLista;

    public DemoEsquemas(DemoConfig demo, DataSource dataSource) {
        this.demo = demo;
        this.dataSource = dataSource;
    }

    public boolean existe(String esquema) { return esquema != null && usadas.containsKey(esquema); }

    public void tocar(String esquema) { usadas.computeIfPresent(esquema, (k, v) -> System.currentTimeMillis()); }

    /** Crea la copia de los datos de prueba para un visitante nuevo y devuelve su nombre */
    public String crear() throws Exception {
        if (usadas.size() >= MAXIMO) borrarMasViejas(usadas.size() - MAXIMO + 1);
        String esquema = "v_" + HexFormat.of().formatHex(azar.generateSeed(6));
        long t0 = System.currentTimeMillis();
        try (Connection c = dataSource.getConnection(); Statement st = c.createStatement()) {
            if (!funcionLista) {
                st.execute(CLONAR);
                funcionLista = true;
            }
            try (PreparedStatement ps = c.prepareStatement("SELECT demo_clonar(?)")) {
                ps.setString(1, esquema);
                ps.execute();
            }
        }
        usadas.put(esquema, System.currentTimeMillis());
        log.info("[Demo] Copia {} creada en {} ms ({} activas)", esquema, System.currentTimeMillis() - t0, usadas.size());
        return esquema;
    }

    @Scheduled(fixedDelay = 15 * 60_000L, initialDelay = 15 * 60_000L)
    public void borrarSinUso() {
        if (!demo.habilitada()) return;
        long limite = System.currentTimeMillis() - VIDA_SIN_USO_MS;
        usadas.entrySet().stream().filter(e -> e.getValue() < limite).map(Map.Entry::getKey).toList().forEach(this::borrar);
    }

    /** Borra todas las copias de visitantes (también las que hayan quedado de un arranque anterior) */
    public void borrarTodas() {
        usadas.clear();
        try (Connection c = dataSource.getConnection(); Statement st = c.createStatement()) {
            List<String> esquemas = new ArrayList<>();
            try (ResultSet rs = st.executeQuery("SELECT nspname FROM pg_namespace WHERE nspname ~ '^v_[0-9a-f]{12}$'")) {
                while (rs.next()) esquemas.add(rs.getString(1));
            }
            for (String e : esquemas) st.execute("DROP SCHEMA \"" + e + "\" CASCADE");
            if (!esquemas.isEmpty()) log.info("[Demo] {} copias de visitantes borradas", esquemas.size());
        } catch (Exception ex) {
            log.error("[Demo] No se pudieron borrar las copias de visitantes", ex);
        }
    }

    private void borrarMasViejas(int cuantas) {
        usadas.entrySet().stream().sorted(Map.Entry.comparingByValue(Comparator.naturalOrder()))
                .limit(cuantas).map(Map.Entry::getKey).toList().forEach(this::borrar);
    }

    private void borrar(String esquema) {
        if (!DemoContexto.valido(esquema)) return;
        usadas.remove(esquema);
        try (Connection c = dataSource.getConnection(); Statement st = c.createStatement()) {
            st.execute("DROP SCHEMA IF EXISTS \"" + esquema + "\" CASCADE");
        } catch (Exception ex) {
            log.warn("[Demo] No se pudo borrar la copia {}: {}", esquema, ex.getMessage());
        }
    }
}
