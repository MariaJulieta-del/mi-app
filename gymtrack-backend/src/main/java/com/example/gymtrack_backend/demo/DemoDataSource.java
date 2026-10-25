package com.example.gymtrack_backend.demo;

import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.context.EnvironmentAware;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.datasource.DelegatingDataSource;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Collections;
import java.util.Map;
import java.util.WeakHashMap;

/**
 * Demo pública: cada conexión que se pide a la base apunta a la copia del visitante del pedido en curso
 * (search_path = su esquema) o a "public" si no hay visitante (arranque, Flyway, tareas programadas).
 * Fuera del modo demo no cambia nada.
 */
@Component
public class DemoDataSource implements BeanPostProcessor, EnvironmentAware {

    private boolean habilitada;

    @Override
    public void setEnvironment(Environment env) {
        habilitada = env.getProperty("demo.habilitada", Boolean.class, false);
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String nombre) {
        if (habilitada && bean instanceof DataSource ds && !(bean instanceof PorVisitante)) return new PorVisitante(ds);
        return bean;
    }

    static final class PorVisitante extends DelegatingDataSource {
        /** search_path de cada conexión física, para no repetir el SET si ya está bien */
        private final Map<Object, String> actual = Collections.synchronizedMap(new WeakHashMap<>());

        PorVisitante(DataSource ds) { super(ds); }

        @Override
        public Connection getConnection() throws SQLException { return apuntar(super.getConnection()); }

        @Override
        public Connection getConnection(String usuario, String clave) throws SQLException { return apuntar(super.getConnection(usuario, clave)); }

        private Connection apuntar(Connection c) throws SQLException {
            String esquema = DemoContexto.actual();
            String destino = esquema == null ? "public" : esquema;
            Object fisica = c.isWrapperFor(org.postgresql.PGConnection.class) ? c.unwrap(org.postgresql.PGConnection.class) : c;
            // Con autocommit el SET queda firme; si no, puede deshacerse con la transacción: se repite siempre
            boolean firme = c.getAutoCommit();
            if (!firme || !destino.equals(actual.get(fisica))) {
                try (Statement st = c.createStatement()) {
                    st.execute("SET search_path TO \"" + destino + "\"");
                }
                if (firme) actual.put(fisica, destino);
                else actual.remove(fisica);
            }
            return c;
        }
    }
}
