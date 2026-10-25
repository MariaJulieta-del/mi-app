package com.example.gymtrack_backend.service;

import com.example.gymtrack_backend.entities.ConfiguracionGimnasio;
import com.example.gymtrack_backend.entities.TarifaMembresia;
import com.example.gymtrack_backend.repository.ConfiguracionGimnasioRepository;
import com.example.gymtrack_backend.repository.TarifaMembresiaRepository;
import jakarta.persistence.PostPersist;
import jakarta.persistence.PostRemove;
import jakarta.persistence.PostUpdate;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;
import java.util.function.Supplier;

/**
 * Datos que casi nunca cambian y se leen en muchos pedidos (los planes y la configuración del gimnasio)
 * quedan en memoria, así no se va a la base cada vez.
 *
 * - Cualquier cambio en esas tablas borra la memoria en el momento (ver {@link Oyente}): rige enseguida.
 * - Igual se vuelven a leer cada 10 minutos, por las dudas.
 * - Solo para lectura: para modificar un plan o la configuración se los lee de la base como siempre.
 */
@Component
public class Catalogo {

    static final long TTL_MS = 10 * 60_000L;
    private static final int MAX_AMBITOS = 500;

    /**
     * Separa la memoria por "ámbito" de datos. Por defecto hay uno solo; la demo pública usa uno por visitante
     * (cada visitante tiene su propia copia de los datos).
     */
    public static volatile Supplier<String> ambito = () -> "";

    private static volatile Catalogo instancia;

    private record Entrada<T>(T valor, long hasta) {}

    private final TarifaMembresiaRepository tarifaRepo;
    private final ConfiguracionGimnasioRepository configRepo;
    private final Map<String, Entrada<Map<String, TarifaMembresia>>> tarifas = new ConcurrentHashMap<>();
    private final Map<String, Entrada<Optional<ConfiguracionGimnasio>>> config = new ConcurrentHashMap<>();

    public Catalogo(TarifaMembresiaRepository tarifaRepo, ConfiguracionGimnasioRepository configRepo) {
        this.tarifaRepo = tarifaRepo;
        this.configRepo = configRepo;
        instancia = this;
    }

    /** Los planes por tipo (MENSUAL, TRIMESTRAL, …), incluidos los que no se ofrecen más */
    public Map<String, TarifaMembresia> tarifas() {
        return leer(tarifas, () -> {
            Map<String, TarifaMembresia> m = new LinkedHashMap<>();
            tarifaRepo.findAll().forEach(t -> m.put(t.getTipo(), t));
            return Collections.unmodifiableMap(m);
        });
    }

    /** Nombre para mostrar de un plan (si no existe, el tipo tal cual) */
    public String nombrePlan(String tipo) {
        if (tipo == null) return null;
        TarifaMembresia t = tarifas().get(tipo);
        return t != null && t.getNombre() != null && !t.getNombre().isBlank() ? t.getNombre() : tipo;
    }

    public Optional<ConfiguracionGimnasio> config() {
        return leer(config, () -> configRepo.findById(ConfiguracionGimnasio.ID));
    }

    public void olvidar() {
        tarifas.clear();
        config.clear();
    }

    private <T> T leer(Map<String, Entrada<T>> memoria, Supplier<T> cargar) {
        String clave = ambito.get();
        long ahora = System.currentTimeMillis();
        Entrada<T> e = memoria.get(clave);
        if (e != null && e.hasta() > ahora) return e.valor();
        T valor = cargar.get();
        if (memoria.size() > MAX_AMBITOS) memoria.clear();
        memoria.put(clave, new Entrada<>(valor, ahora + TTL_MS));
        return valor;
    }

    /** Escucha los cambios de planes y de la configuración para que rijan enseguida */
    public static class Oyente {
        @PostPersist
        @PostUpdate
        @PostRemove
        void cambio(Object entidad) {
            Catalogo c = instancia;
            if (c != null) c.olvidar();
        }
    }

    /** Para armar mapas tipo → algo a partir de los planes */
    public <V> Map<String, V> porTipo(Function<TarifaMembresia, V> f) {
        Map<String, V> m = new LinkedHashMap<>();
        tarifas().forEach((k, v) -> m.put(k, f.apply(v)));
        return m;
    }
}
