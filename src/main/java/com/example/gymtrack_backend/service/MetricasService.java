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
    private final com.example.gymtrack_backend.repository.BajaSocioRepository bajaRepo;
    private final com.example.gymtrack_backend.repository.SocioRepository socioRepo;

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
        Map<Long, LocalDate> ultimas = new HashMap<>();
        for (Object[] f : asistenciaRepo.ultimaVisitaPorSocio(true)) ultimas.put((Long) f[0], (LocalDate) f[1]);
        for (Membresia m : membresiaRepo.conSocioPorEstado(EstadoMembresia.ACTIVA)) {
            Socio s = m.getSocio();
            if (s == null || !Boolean.TRUE.equals(s.getActivo()) || m.getFechaVencimiento().isBefore(hoy)) continue;

            LocalDate ultima = ultimas.get(s.getId());
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

        // Socios que pagaron en cada mes (solo hacen falta los últimos 7 meses)
        Map<YearMonth, Set<Long>> pagaronEn = new HashMap<>();
        Map<YearMonth, BigDecimal> recaudadoEn = new HashMap<>();
        for (Object[] f : pagoRepo.completadosDesde(mesActual.minusMonths(6).atDay(1).atStartOfDay())) {
            YearMonth ym = YearMonth.from((java.time.LocalDateTime) f[0]);
            Long sid = (Long) f[2];
            pagaronEn.computeIfAbsent(ym, k -> new HashSet<>()).add(sid);
            recaudadoEn.merge(ym, (BigDecimal) f[1], BigDecimal::add);
        }
        // Mes del primer pago de cada socio (para contar los nuevos)
        Map<Long, YearMonth> primerPago = new HashMap<>();
        for (Object[] f : pagoRepo.primerPagoPorSocio()) primerPago.put((Long) f[0], YearMonth.from((java.time.LocalDateTime) f[1]));

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

        int vigentes = (int) membresiaRepo.conSocioPorEstado(EstadoMembresia.ACTIVA).stream()
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


    // ── Indicadores del dueño ────────────────────────────────────────────────

    public record Cohorte(String mes, int altas, List<Integer> retencion) {}
    public record MesBajas(String mes, int perdidos, int base, Integer tasa) {}
    public record Indicadores(BigDecimal ingresoMensualRecurrente, BigDecimal ticketPromedio, int sociosVigentes,
                              Double bajaMensualPromedio, BigDecimal valorPorSocio, Double vidaPromedioMeses,
                              Double antiguedadPromedioMeses, List<MesBajas> bajasPorMes, List<Cohorte> cohortes) {}

    /**
     * Números para decidir:
     *  - Ingreso mensual recurrente: lo que entra por mes con las membresías vigentes (un trimestral cuenta un tercio).
     *  - Baja mensual: de los que estaban el mes anterior, cuántos se dieron de baja o no renovaron (promedio 5 meses).
     *  - Valor por socio: ingreso mensual promedio × cuántos meses se queda un socio en promedio (1 / baja mensual).
     *  - Retención por mes de alta: de los que empezaron cada mes, qué porcentaje siguió 1, 2 y 3 meses después.
     */
    public Indicadores indicadores() {
        LocalDate hoy = LocalDate.now();
        YearMonth mesActual = YearMonth.from(hoy);

        List<Membresia> vigentes = membresiaRepo.conSocioPorEstado(EstadoMembresia.ACTIVA).stream()
                .filter(m -> m.getFechaVencimiento() != null && !m.getFechaVencimiento().isBefore(hoy))
                .filter(m -> m.getSocio() != null && Boolean.TRUE.equals(m.getSocio().getActivo()))
                .toList();
        BigDecimal mrr = BigDecimal.ZERO;
        for (Membresia m : vigentes) {
            if (m.getPrecio() == null) continue;
            long dias = m.getFechaInicio() != null ? Math.max(1, ChronoUnit.DAYS.between(m.getFechaInicio(), m.getFechaVencimiento())) : 30;
            mrr = mrr.add(m.getPrecio().multiply(BigDecimal.valueOf(30)).divide(BigDecimal.valueOf(Math.max(28, dias)), 2, RoundingMode.HALF_UP));
        }
        mrr = mrr.setScale(0, RoundingMode.HALF_UP);
        BigDecimal ticket = vigentes.isEmpty() ? BigDecimal.ZERO : mrr.divide(BigDecimal.valueOf(vigentes.size()), 0, RoundingMode.HALF_UP);

        // Primer pago de cada socio
        Map<Long, YearMonth> primerPago = new HashMap<>();
        for (Object[] f : pagoRepo.primerPagoPorSocio()) primerPago.put((Long) f[0], YearMonth.from((java.time.LocalDateTime) f[1]));
        // Un socio "sigue" en un mes si su membresía cubre algún día de ese mes y no estaba dado de baja antes
        Map<Long, List<Membresia>> membresiasDe = new HashMap<>();
        for (Membresia m : membresiaRepo.todasConSocio()) {
            if (m.getSocio() != null) membresiasDe.computeIfAbsent(m.getSocio().getId(), k -> new ArrayList<>()).add(m);
        }
        Map<Long, LocalDate> bajaDe = new HashMap<>();
        Map<YearMonth, Integer> bajasEn = new HashMap<>();
        bajaRepo.findAllConSocio().forEach(b -> {
            bajasEn.merge(YearMonth.from(b.getFecha()), 1, Integer::sum);
            if (b.getSocio() != null && !Boolean.TRUE.equals(b.getSocio().getActivo())) bajaDe.merge(b.getSocio().getId(), b.getFecha().toLocalDate(), (x, y) -> x.isAfter(y) ? x : y);
        });
        java.util.function.BiPredicate<Long, YearMonth> activoEn = (sid, ym) -> {
            LocalDate baja = bajaDe.get(sid);
            if (baja != null && baja.isBefore(ym.atDay(1))) return false;
            return membresiasDe.getOrDefault(sid, List.of()).stream().anyMatch(m -> m.getFechaInicio() != null && m.getFechaVencimiento() != null
                    && !m.getFechaInicio().isAfter(ym.atEndOfMonth()) && !m.getFechaVencimiento().isBefore(ym.atDay(1)));
        };

        // Bajas por mes: de los que estaban activos el mes anterior, cuántos ya no siguen
        Set<Long> todos = membresiasDe.keySet();
        List<MesBajas> bajasPorMes = new ArrayList<>();
        List<Double> tasas = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth ym = mesActual.minusMonths(i);
            List<Long> base = todos.stream().filter(sid -> activoEn.test(sid, ym.minusMonths(1))).toList();
            int perdidos;
            if (i == 0) perdidos = bajasEn.getOrDefault(ym, 0);   // el mes en curso: solo las bajas registradas
            else perdidos = (int) base.stream().filter(sid -> !activoEn.test(sid, ym)).count();
            Integer tasa = base.isEmpty() ? null : Math.round(perdidos * 100f / base.size());
            if (tasa != null && i != 0) tasas.add(tasa.doubleValue());
            bajasPorMes.add(new MesBajas(ym.toString(), perdidos, base.size(), tasa));
        }
        Double churn = tasas.isEmpty() ? null : Math.round(tasas.stream().mapToDouble(Double::doubleValue).average().orElse(0) * 10) / 10.0;
        Double vida = churn == null || churn <= 0 ? null : Math.min(60, Math.round(1000 / churn) / 10.0);
        BigDecimal valor = vida == null ? null : ticket.multiply(BigDecimal.valueOf(vida)).setScale(0, RoundingMode.HALF_UP);

        double antig = socioRepo.findByActivoTrue().stream().filter(s -> s.getFechaCreacion() != null)
                .mapToLong(s -> ChronoUnit.DAYS.between(s.getFechaCreacion().toLocalDate(), hoy)).average().orElse(0) / 30.4;

        // Cohortes de los últimos 6 meses: % que sigue 1, 2 y 3 meses después de empezar
        List<Cohorte> cohortes = new ArrayList<>();
        for (int i = 6; i >= 1; i--) {
            YearMonth ym = mesActual.minusMonths(i);
            List<Long> altas = primerPago.entrySet().stream().filter(e -> e.getValue().equals(ym)).map(Map.Entry::getKey).toList();
            List<Integer> ret = new ArrayList<>();
            for (int k = 1; k <= 3; k++) {
                YearMonth despues = ym.plusMonths(k);
                if (despues.isAfter(mesActual) || altas.isEmpty()) { ret.add(null); continue; }
                long siguen = altas.stream().filter(sid -> activoEn.test(sid, despues)).count();
                ret.add(Math.round(siguen * 100f / altas.size()));
            }
            cohortes.add(new Cohorte(ym.toString(), altas.size(), ret));
        }

        return new Indicadores(mrr, ticket, vigentes.size(), churn, valor, vida, Math.round(antig * 10) / 10.0, bajasPorMes, cohortes);
    }
}
