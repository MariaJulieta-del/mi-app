package com.example.gymtrack_backend.service;

import com.example.gymtrack_backend.dto.MembresiaResponseDTO;
import com.example.gymtrack_backend.entities.Membresia;
import com.example.gymtrack_backend.entities.Socio;
import com.example.gymtrack_backend.entities.TarifaMembresia;
import com.example.gymtrack_backend.entities.enums.EstadoMembresia;
import com.example.gymtrack_backend.repository.AsistenciaRepository;
import com.example.gymtrack_backend.repository.MembresiaRepository;
import com.example.gymtrack_backend.repository.SocioRepository;
import com.example.gymtrack_backend.repository.TarifaMembresiaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Reglas de membresía:
 *  - Cada socio tiene UNA sola membresía. Pagar un plan la crea o la renueva.
 *  - No existe el fiado: la membresía solo se activa con un pago.
 *  - Cada plan define N pases por mes (null = libre). Los pases se cuentan por ciclo mensual
 *    a partir de fechaInicio y un mismo día consume un solo pase.
 */
@Service
public class MembresiaService {

    @Autowired
    private MembresiaRepository membresiaRepository;

    @Autowired
    private SocioRepository socioRepository;

    @Autowired
    private TarifaMembresiaRepository tarifaRepository;

    @Autowired
    private AsistenciaRepository asistenciaRepository;

    @Autowired
    private com.example.gymtrack_backend.repository.ReservaClaseRepository reservaRepository;

    // ──────────────────────────────────────────────
    // RENOVAR / ASIGNAR PLAN (siempre asociado a un pago)
    // ──────────────────────────────────────────────

    /**
     * Crea la membresía del socio o la renueva con el plan indicado.
     *  - Si está ACTIVA: se extiende el vencimiento (no se pierden días ya pagos).
     *  - Si está VENCIDA/CANCELADA o no existe: arranca hoy.
     * El precio y los pases se toman del tarifario en este momento.
     */
    @Transactional
    public Membresia renovar(Long socioId, String planTipo) {
        Socio socio = socioRepository.findById(socioId)
            .orElseThrow(() -> new com.example.gymtrack_backend.web.RecursoNoEncontradoException("Socio no encontrado: " + socioId));
        if (!Boolean.TRUE.equals(socio.getActivo())) {
            throw new RuntimeException("El socio está dado de baja. Reactivalo antes de cobrarle un plan.");
        }

        TarifaMembresia tarifa = tarifaRepository.findById(planTipo.toUpperCase())
            .orElseThrow(() -> new com.example.gymtrack_backend.web.RecursoNoEncontradoException("Plan no encontrado: " + planTipo));
        if (Boolean.FALSE.equals(tarifa.getActivo())) {
            throw new RuntimeException("El plan " + tarifa.getNombre() + " está deshabilitado. Elegí otro o habilitalo en Membresías.");
        }
        if (tarifa.getDuracionDias() == null || tarifa.getDuracionDias() <= 0) {
            throw new RuntimeException("El plan no tiene duración configurada: " + planTipo);
        }

        LocalDate hoy = LocalDate.now();
        Membresia m = membresiaRepository.findBySocioId(socioId).orElseGet(() -> {
            Membresia nueva = new Membresia();
            nueva.setSocio(socio);
            return nueva;
        });

        boolean vigente = m.getId() != null
                && m.getEstadoMembresia() == EstadoMembresia.ACTIVA
                && m.getFechaVencimiento() != null
                && !m.getFechaVencimiento().isBefore(hoy);

        if (vigente) {
            m.setFechaVencimiento(m.getFechaVencimiento().plusDays(tarifa.getDuracionDias()));
        } else {
            m.setFechaInicio(hoy);
            m.setFechaVencimiento(hoy.plusDays(tarifa.getDuracionDias()));
        }

        m.setTipoMembresia(tarifa.getTipo());
        m.setPrecio(tarifa.getPrecio());
        m.setPasesMensuales(tarifa.getPasesMensuales());
        m.setEstadoMembresia(EstadoMembresia.ACTIVA);
        return membresiaRepository.save(m);
    }

    // ──────────────────────────────────────────────
    // PASES — única fuente de verdad
    // ──────────────────────────────────────────────

    /** Estado de los pases del ciclo mensual que contiene a `hoy`. */
    public record PasesInfo(boolean libre, Integer pasesMensuales, int usados, Integer restantes,
                            LocalDate cicloInicio, LocalDate cicloFin) {}

    /** Ciclo mensual de la membresía que contiene a `hoy` (arranca el día del mes en que empezó) */
    static LocalDate[] ciclo(Membresia m, LocalDate hoy) {
        LocalDate inicio = m.getFechaInicio() != null ? m.getFechaInicio() : hoy;
        long meses = Math.max(0, ChronoUnit.MONTHS.between(inicio, hoy));
        LocalDate cicloInicio = inicio.plusMonths(meses);
        LocalDate cicloFin = cicloInicio.plusMonths(1).minusDays(1);
        if (m.getFechaVencimiento() != null && cicloFin.isAfter(m.getFechaVencimiento())) {
            cicloFin = m.getFechaVencimiento();
        }
        return new LocalDate[]{cicloInicio, cicloFin};
    }

    static PasesInfo armarPases(Membresia m, LocalDate[] c, int usados) {
        Integer total = m.getPasesMensuales();
        boolean libre = total == null || total <= 0;
        Integer restantes = libre ? null : Math.max(0, total - usados);
        return new PasesInfo(libre, libre ? null : total, usados, restantes, c[0], c[1]);
    }

    public PasesInfo calcularPases(Membresia m, LocalDate hoy) {
        LocalDate[] c = ciclo(m, hoy);
        // Días con ingreso + clases reservadas a las que no vino (el faltazo cuenta como pase usado)
        int usados = (int) asistenciaRepository.countDiasConIngreso(m.getSocio().getId(), c[0], c[1])
                + (int) reservaRepository.contarAusentes(m.getSocio().getId(), c[0], c[1]);
        return armarPases(m, c, usados);
    }

    /**
     * Pases de muchas membresías con 2 consultas en total (en lugar de 2 por membresía):
     * se traen los días con ingreso y los faltazos del período que cubre todos los ciclos.
     */
    Map<Long, PasesInfo> calcularPasesDeTodas(List<Membresia> lista, LocalDate hoy) {
        Map<Long, PasesInfo> res = new HashMap<>();
        if (lista.isEmpty()) return res;
        Map<Long, LocalDate[]> ciclos = new HashMap<>();
        LocalDate desde = hoy, hasta = hoy;
        for (Membresia m : lista) {
            LocalDate[] c = ciclo(m, hoy);
            ciclos.put(m.getId(), c);
            if (c[0].isBefore(desde)) desde = c[0];
            if (c[1].isAfter(hasta)) hasta = c[1];
        }
        Map<Long, List<LocalDate>> ingresos = new HashMap<>();
        for (Object[] f : asistenciaRepository.diasConIngresoEntre(desde, hasta)) {
            ingresos.computeIfAbsent((Long) f[0], k -> new ArrayList<>()).add((LocalDate) f[1]);
        }
        Map<Long, List<LocalDate>> ausentes = new HashMap<>();
        for (Object[] f : reservaRepository.ausentesEntre(desde, hasta)) {
            ausentes.computeIfAbsent((Long) f[0], k -> new ArrayList<>()).add((LocalDate) f[1]);
        }
        for (Membresia m : lista) {
            LocalDate[] c = ciclos.get(m.getId());
            Long sid = m.getSocio().getId();
            int usados = (int) ingresos.getOrDefault(sid, List.of()).stream().filter(d -> !d.isBefore(c[0]) && !d.isAfter(c[1])).count()
                    + (int) ausentes.getOrDefault(sid, List.of()).stream().filter(d -> !d.isBefore(c[0]) && !d.isAfter(c[1])).count();
            res.put(m.getId(), armarPases(m, c, usados));
        }
        return res;
    }

    /** Lista de respuestas con los pases calculados de una vez */
    private List<MembresiaResponseDTO> mapearLista(List<Membresia> lista) {
        LocalDate hoy = LocalDate.now();
        Map<String, TarifaMembresia> planes = planesPorTipo();
        Map<Long, PasesInfo> pases = calcularPasesDeTodas(lista, hoy);
        return lista.stream().map(m -> mapearAResponseDTO(m, planes, pases.get(m.getId()))).collect(Collectors.toList());
    }

    /** ¿La membresía está activa y no venció? */
    public boolean estaVigente(Membresia m, LocalDate hoy) {
        return m.getEstadoMembresia() == EstadoMembresia.ACTIVA
                && (m.getFechaVencimiento() == null || !m.getFechaVencimiento().isBefore(hoy));
    }

    // ──────────────────────────────────────────────
    // LEER
    // ──────────────────────────────────────────────

    public List<MembresiaResponseDTO> listarTodas() {
        return mapearLista(membresiaRepository.todasConSocio());
    }

    public MembresiaResponseDTO obtenerPorId(Long id) {
        Membresia m = membresiaRepository.findById(id)
            .orElseThrow(() -> new com.example.gymtrack_backend.web.RecursoNoEncontradoException("Membresía no encontrada: " + id));
        return mapearAResponseDTO(m);
    }

    /** La membresía del socio (vacío si nunca pagó un plan) */
    public Optional<MembresiaResponseDTO> obtenerDeSocio(Long socioId) {
        return membresiaRepository.findBySocioId(socioId).map(this::mapearAResponseDTO);
    }

    /** Membresías ACTIVAS que vencen dentro de los próximos `dias` días */
    public List<MembresiaResponseDTO> listarProximasAVencer(int dias) {
        LocalDate hoy = LocalDate.now();
        return mapearLista(membresiaRepository
            .findByEstadoMembresiaAndFechaVencimientoBetween(EstadoMembresia.ACTIVA, hoy, hoy.plusDays(dias))
            .stream()
            .sorted(Comparator.comparing(Membresia::getFechaVencimiento))
            .toList());
    }

    // ──────────────────────────────────────────────
    // CANCELAR
    // ──────────────────────────────────────────────

    @Transactional
    public MembresiaResponseDTO cambiarEstado(Long id, EstadoMembresia nuevoEstado) {
        Membresia membresia = membresiaRepository.findById(id)
            .orElseThrow(() -> new com.example.gymtrack_backend.web.RecursoNoEncontradoException("Membresía no encontrada: " + id));

        if (nuevoEstado != EstadoMembresia.CANCELADA) {
            throw new RuntimeException("Para activar una membresía hay que registrar un pago (renovar).");
        }
        if (membresia.getEstadoMembresia() != EstadoMembresia.ACTIVA) {
            throw new RuntimeException("Solo se puede cancelar una membresía activa");
        }

        membresia.setEstadoMembresia(EstadoMembresia.CANCELADA);
        com.example.gymtrack_backend.auditoria.AuditoriaInterceptor.socio(membresia.getSocio().getId());
        com.example.gymtrack_backend.auditoria.AuditoriaInterceptor.detalle("Canceló la membresía " + membresia.getTipoMembresia());
        return mapearAResponseDTO(membresiaRepository.save(membresia));
    }

    // ──────────────────────────────────────────────
    // HELPERS
    // ──────────────────────────────────────────────

    private Map<String, TarifaMembresia> planesPorTipo() {
        return tarifaRepository.findAll().stream()
            .collect(Collectors.toMap(TarifaMembresia::getTipo, Function.identity()));
    }

    public MembresiaResponseDTO mapearAResponseDTO(Membresia m) {
        return mapearAResponseDTO(m, planesPorTipo());
    }

    private MembresiaResponseDTO mapearAResponseDTO(Membresia m, Map<String, TarifaMembresia> planes) {
        return mapearAResponseDTO(m, planes, null);
    }

    private MembresiaResponseDTO mapearAResponseDTO(Membresia m, Map<String, TarifaMembresia> planes, PasesInfo calculados) {
        LocalDate hoy = LocalDate.now();
        MembresiaResponseDTO dto = new MembresiaResponseDTO();
        dto.setId(m.getId());
        dto.setSocioId(m.getSocio().getId());
        dto.setSocioNombreCompleto(m.getSocio().getNombre() + " " + m.getSocio().getApellido());
        dto.setTipoMembresia(m.getTipoMembresia());
        TarifaMembresia plan = planes.get(m.getTipoMembresia());
        dto.setPlanNombre(plan != null && plan.getNombre() != null ? plan.getNombre() : m.getTipoMembresia());
        dto.setEstadoMembresia(m.getEstadoMembresia());
        dto.setFechaInicio(m.getFechaInicio());
        dto.setFechaVencimiento(m.getFechaVencimiento());
        dto.setPrecio(m.getPrecio());
        dto.setFechaCreacion(m.getFechaCreacion());
        if (m.getFechaVencimiento() != null) {
            dto.setDiasRestantes(ChronoUnit.DAYS.between(hoy, m.getFechaVencimiento()));
        }

        PasesInfo pases = calculados != null ? calculados : calcularPases(m, hoy);
        dto.setPaseLibre(pases.libre());
        dto.setPasesMensuales(pases.pasesMensuales());
        dto.setPasesUsados(pases.usados());
        dto.setPasesRestantes(pases.restantes());
        dto.setCicloInicio(pases.cicloInicio());
        dto.setCicloFin(pases.cicloFin());
        return dto;
    }
}
