package com.example.gymtrack_backend.service;

import com.example.gymtrack_backend.entities.BajaSocio;
import com.example.gymtrack_backend.entities.Membresia;
import com.example.gymtrack_backend.entities.Socio;
import com.example.gymtrack_backend.repository.BajaSocioRepository;
import com.example.gymtrack_backend.repository.MembresiaRepository;
import com.example.gymtrack_backend.repository.SocioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Listado de socios para el staff: búsqueda, filtros, orden y paginación en el servidor.
 * Devuelve solo la página pedida (antes se mandaban todos los socios y todas las membresías).
 * Son 3 consultas en total, sin importar cuántos socios haya.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SocioListadoService {

    private final SocioRepository socioRepo;
    private final MembresiaRepository membresiaRepo;
    private final BajaSocioRepository bajaRepo;

    public static final int TAM_MAXIMO = 100;

    /** Una fila del listado: el socio y lo justo de su membresía y su baja */
    public record Fila(Long id, String nombre, String apellido, String dni, String email, String telefono,
                       Boolean activo, String estado, LocalDate fechaNacimiento, String genero,
                       LocalDateTime fechaCreacion, String estadoMembresia, LocalDate vencimiento,
                       String motivoBaja, LocalDateTime fechaBaja) {}

    public record Conteos(int activos, int inactivos, int alDia, int vencidas, int sinMembresia) {}

    public record Pagina(List<Fila> items, int total, int pagina, int paginas, int tam, Conteos conteos) {}

    /**
     * @param vista     activos | inactivos | todos
     * @param membresia vacío | ACTIVA | VENCIDA | SIN_MEMBRESIA (solo socios activos)
     * @param orden     apellido | nombre | vencimiento | alta
     */
    public Pagina buscar(String q, String vista, String membresia, String orden, boolean desc, int pagina, int tam) {
        int t = Math.max(1, Math.min(TAM_MAXIMO, tam));
        String v = vista == null || vista.isBlank() ? "activos" : vista.toLowerCase();
        if (!Set.of("activos", "inactivos", "todos").contains(v)) throw new IllegalArgumentException("Vista inválida: " + vista);
        String fm = membresia == null ? "" : membresia.toUpperCase();
        if (!Set.of("", "ACTIVA", "VENCIDA", "SIN_MEMBRESIA").contains(fm)) throw new IllegalArgumentException("Filtro de membresía inválido: " + membresia);
        String o = orden == null || orden.isBlank() ? "apellido" : orden.toLowerCase();
        if (!Set.of("apellido", "nombre", "vencimiento", "alta").contains(o)) throw new IllegalArgumentException("Orden inválido: " + orden);

        Map<Long, Membresia> memDe = new HashMap<>();
        for (Membresia m : membresiaRepo.todasConSocio()) memDe.put(m.getSocio().getId(), m);
        Map<Long, BajaSocio> bajaDe = new HashMap<>();
        for (BajaSocio b : bajaRepo.findAllConSocio()) {
            if (b.getSocio() != null) bajaDe.putIfAbsent(b.getSocio().getId(), b);   // vienen de la más nueva a la más vieja
        }

        List<Socio> todos = socioRepo.findAll();
        int activos = 0, inactivos = 0, alDia = 0, vencidas = 0, sin = 0;
        for (Socio s : todos) {
            if (esInactivo(s)) { inactivos++; continue; }
            activos++;
            String e = estadoMembresia(memDe.get(s.getId()));
            if ("ACTIVA".equals(e)) alDia++; else if ("VENCIDA".equals(e)) vencidas++; else sin++;
        }

        String texto = q == null ? "" : q.trim().toLowerCase();
        List<Socio> filtrados = todos.stream().filter(s -> {
            boolean inac = esInactivo(s);
            if ("activos".equals(v) && inac) return false;
            if ("inactivos".equals(v) && !inac) return false;
            if (!fm.isEmpty()) {
                if (inac) return false;
                String e = estadoMembresia(memDe.get(s.getId()));
                if (!fm.equals(e)) return false;
            }
            if (texto.isEmpty()) return true;
            return contiene(s.getNombre(), texto) || contiene(s.getApellido(), texto)
                    || contiene(s.getNombre() + " " + s.getApellido(), texto)
                    || (s.getDni() != null && s.getDni().contains(texto)) || contiene(s.getEmail(), texto);
        }).sorted(comparador(o, memDe, desc)).toList();

        int total = filtrados.size();
        int paginas = Math.max(1, (total + t - 1) / t);
        int p = Math.max(1, Math.min(pagina, paginas));
        List<Fila> items = filtrados.subList((p - 1) * t, Math.min(total, p * t)).stream().map(s -> {
            Membresia m = memDe.get(s.getId());
            BajaSocio b = esInactivo(s) ? bajaDe.get(s.getId()) : null;
            return new Fila(s.getId(), s.getNombre(), s.getApellido(), s.getDni(), s.getEmail(), s.getTelefono(),
                    s.getActivo(), s.getEstado(), s.getFechaNacimiento(), s.getGenero(), s.getFechaCreacion(),
                    m == null ? null : m.getEstadoMembresia().name(), m == null ? null : m.getFechaVencimiento(),
                    b == null ? null : b.getMotivo(), b == null ? null : b.getFecha());
        }).toList();
        return new Pagina(items, total, p, paginas, t, new Conteos(activos, inactivos, alDia, vencidas, sin));
    }

    static boolean esInactivo(Socio s) {
        return Boolean.FALSE.equals(s.getActivo()) || "INACTIVO".equals(s.getEstado());
    }

    /** ACTIVA, VENCIDA o SIN_MEMBRESIA (una cancelada cuenta como sin membresía) */
    static String estadoMembresia(Membresia m) {
        if (m == null) return "SIN_MEMBRESIA";
        return switch (m.getEstadoMembresia()) {
            case ACTIVA -> "ACTIVA";
            case VENCIDA -> "VENCIDA";
            default -> "SIN_MEMBRESIA";
        };
    }

    private static boolean contiene(String campo, String texto) {
        return campo != null && campo.toLowerCase().contains(texto);
    }

    private static Comparator<Socio> comparador(String orden, Map<Long, Membresia> memDe, boolean desc) {
        Comparator<String> txt = Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER);
        Comparator<Socio> c = switch (orden) {
            case "nombre" -> Comparator.comparing(Socio::getNombre, txt).thenComparing(Socio::getApellido, txt);
            case "vencimiento" -> Comparator.comparing((Socio s) -> memDe.get(s.getId()) == null ? null : memDe.get(s.getId()).getFechaVencimiento(),
                    Comparator.nullsLast(Comparator.<LocalDate>naturalOrder()));
            case "alta" -> Comparator.comparing(Socio::getFechaCreacion, Comparator.nullsLast(Comparator.<LocalDateTime>naturalOrder()));
            default -> Comparator.comparing(Socio::getApellido, txt).thenComparing(Socio::getNombre, txt);
        };
        c = c.thenComparing(Socio::getId);
        return desc ? c.reversed() : c;
    }
}
