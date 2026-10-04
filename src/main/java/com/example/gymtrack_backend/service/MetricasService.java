package com.example.gymtrack_backend.service;

import com.example.gymtrack_backend.entities.Asistencia;
import com.example.gymtrack_backend.entities.Membresia;
import com.example.gymtrack_backend.entities.Pago;
import com.example.gymtrack_backend.entities.Socio;
import com.example.gymtrack_backend.entities.enums.EstadoMembresia;
import com.example.gymtrack_backend.entities.enums.EstadoPago;
import com.example.gymtrack_backend.repository.AsistenciaRepository;
import com.example.gymtrack_backend.repository.MembresiaRepository;
import com.example.gymtrack_backend.repository.PagoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Métricas de negocio para el admin: retención, ingreso por socio, ocupación por horario
 * y socios en riesgo de abandonar.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MetricasService {

    /** Sin venir hace estos días = en riesgo */
    public static final int DIAS_SIN_VENIR_RIESGO = 10;
    /** Membresía que vence en estos días = en riesgo si además viene poco */
    public static final int DIAS_VENCE_RIESGO = 7;

    private final PagoRepository       pagoRepo;
    private final MembresiaRepository  membresiaRepo;
    private final AsistenciaRepository asistenciaRepo;

    // ── Socios en riesgo ─────────────────────────────────────────────────────

    public record SocioEnRiesgo(Long socioId, String nombre, String telefono, LocalDate ultimaVisita,
                                Long diasSinVenir, Long diasParaVencer, List<String> motivos) {}

    /**
     * Socios con membresía vigente que dejaron de venir, nunca vinieron,
     * o están por vencer sin haber venido en la última semana.
     */
    public List<SocioEnRiesgo> enRiesgo() {
        LocalDate hoy = LocalDate.now();
        List<SocioEnRiesgo> lista = new ArrayList<>();
        for (Membresia m : membresiaRepo.findByEstadoMembresia(EstadoMembresia.ACTIVA)) {
            Socio s = m.getSocio();
            if (s == null || !Boolean.TRUE.equals(s.getActivo()) || m.getFechaVencimiento().isBefore(hoy)) continue;

            LocalDate ultima = asistenciaRepo.findBySocioIdOrderByFechaDescHoraDesc(s.getId()).stream()
                    .filter(a -> Boolean.TRUE.equals(a.getPermitido()))
                    .map(Asistencia::getFecha).findFirst().orElse(null);
            Long sinVenir = ultima == null ? null : ChronoUnit.DAYS.between(ultima, hoy);
            long venceEn = ChronoUnit.DAYS.between(hoy, m.getFechaVencimiento());

            List<String> motivos = new ArrayList<>();
            if (ultima == null) {
                // Recién pagó: darle unos días antes de marcarlo
                if (m.getFechaInicio() != null && ChronoUnit.DAYS.between(m.getFechaInicio(), hoy) >= 5) motivos.add("NUNCA_VINO");
            } else if (sinVenir >= DIAS_SIN_VENIR_RIESGO) {
                motivos.add("NO_VIENE");
            }
            if (venceEn <= DIAS_VENCE_RIESGO && (sinVenir == null || sinVenir >= 7)) motivos.add("VENCE_SIN_VENIR");
            if (motivos.isEmpty()) continue;

            lista.add(new SocioEnRiesgo(s.getId(), s.getNombre() + " " + s.getApellido(), s.getTelefono(),
                    ultima, sinVenir, venceEn, motivos));
        }
        // Los que hace más que no vienen primero (los que nunca vinieron, arriba)
        lista.sort(Comparator.comparing((SocioEnRiesgo r) -> r.diasSinVenir() == null ? Long.MAX_VALUE : r.diasSinVenir()).reversed());
        return lista;
    }

    // ── Métricas ─────────────────────────────────────────────────────────────

    public record MesRetencion(String mes, int base, int retenidos, Integer porcentaje, int nuevos, BigDecimal recaudado) {}
    public record Metricas(int sociosVigentes, BigDecimal recaudadoMes, BigDecimal ingresoPromedioPorSocio,
                           List<MesRetencion> meses, double[][] ocupacion, int semanasOcupacion) {}

    public Metricas metricas() {
        LocalDate hoy = LocalDate.now();
        YearMonth mesActual = YearMonth.from(hoy);

        List<Pago> pagos = pagoRepo.findAll().stream()
                .filter(p -> p.getEstadoPago() == EstadoPago.COMPLETADO && p.getFechaPago() != null
                        && p.getMembresia() != null && p.getMembresia().getSocio() != null)
                .toList();

        // Socios que pagaron en cada mes
        Map<YearMonth, Set<Long>> pagaronEn = new HashMap<>();
        Map<YearMonth, BigDecimal> recaudadoEn = new HashMap<>();
        Map<Long, YearMonth> primerPago = new HashMap<>();
        for (Pago p : pagos) {
            YearMonth ym = YearMonth.from(p.getFechaPago());
            Long sid = p.getMembresia().getSocio().getId();
            pagaronEn.computeIfAbsent(ym, k -> new HashSet<>()).add(sid);
            recaudadoEn.merge(ym, p.getMonto(), BigDecimal::add);
            primerPago.merge(sid, ym, (a, b) -> a.isBefore(b) ? a : b);
        }

        // Últimos 6 meses: de los que pagaron el mes anterior, cuántos volvieron a pagar
        List<MesRetencion> meses = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth ym = mesActual.minusMonths(i);
            Set<Long> base = pagaronEn.getOrDefault(ym.minusMonths(1), Set.of());
            Set<Long> ahora = pagaronEn.getOrDefault(ym, Set.of());
            int retenidos = (int) base.stream().filter(ahora::contains).count();
            int nuevos = (int) primerPago.values().stream().filter(ym::equals).count();
            meses.add(new MesRetencion(ym.toString(), base.size(), retenidos,
                    base.isEmpty() ? null : Math.round(retenidos * 100f / base.size()),
                    nuevos, recaudadoEn.getOrDefault(ym, BigDecimal.ZERO)));
        }

        int vigentes = (int) membresiaRepo.findByEstadoMembresia(EstadoMembresia.ACTIVA).stream()
                .filter(m -> !m.getFechaVencimiento().isBefore(hoy))
                .filter(m -> m.getSocio() != null && Boolean.TRUE.equals(m.getSocio().getActivo()))
                .count();
        BigDecimal recaudadoMes = recaudadoEn.getOrDefault(mesActual, BigDecimal.ZERO);
        BigDecimal promedio = vigentes == 0 ? BigDecimal.ZERO
                : recaudadoMes.divide(BigDecimal.valueOf(vigentes), 0, RoundingMode.HALF_UP);

        // Ocupación: ingresos promedio por día de la semana y hora (últimas 8 semanas)
        int semanas = 8;
        double[][] ocupacion = new double[7][24];
        for (Asistencia a : asistenciaRepo.findByFechaBetweenOrderByFechaDescHoraDesc(hoy.minusWeeks(semanas), hoy.minusDays(1))) {
            if (!Boolean.TRUE.equals(a.getPermitido()) || !"ENTRADA".equals(a.getTipo()) || a.getHora() == null) continue;
            ocupacion[a.getFecha().getDayOfWeek().getValue() - 1][a.getHora().getHour()] += 1.0 / semanas;
        }
        for (double[] fila : ocupacion) {
            for (int h = 0; h < 24; h++) fila[h] = Math.round(fila[h] * 10) / 10.0;
        }

        return new Metricas(vigentes, recaudadoMes, promedio, meses, ocupacion, semanas);
    }

}
