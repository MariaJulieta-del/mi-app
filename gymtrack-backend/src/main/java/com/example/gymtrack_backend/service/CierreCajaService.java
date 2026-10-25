package com.example.gymtrack_backend.service;

import com.example.gymtrack_backend.dto.CierreCajaRequestDTO;
import com.example.gymtrack_backend.dto.CierreCajaResponseDTO;
import com.example.gymtrack_backend.entities.CierreCaja;
import com.example.gymtrack_backend.entities.enums.MetodoPago;
import com.example.gymtrack_backend.repository.CierreCajaRepository;
import com.example.gymtrack_backend.repository.EgresoRepository;
import com.example.gymtrack_backend.repository.PagoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Caja diaria (efectivo físico):
 *   fondo inicial (lo que se dejó en el cierre anterior)
 * + cobros en efectivo del día
 * − gastos pagados de la caja (egresos)
 * = efectivo esperado. Al cerrar se cuenta, se ve la diferencia y se decide cuánto queda para mañana.
 */
@Service
@RequiredArgsConstructor
public class CierreCajaService {

    private final CierreCajaRepository cierreRepo;
    private final PagoRepository pagoRepo;
    private final EgresoRepository egresoRepo;

    /** Días hacia atrás en los que se buscan cajas sin cerrar */
    static final int DIAS_PENDIENTES = 30;

    private record Totales(BigDecimal efectivo, BigDecimal tarjeta, BigDecimal transferencia, BigDecimal egresos, long pagos) {}

    private static BigDecimal cero(BigDecimal v) { return v == null ? BigDecimal.ZERO : v; }

    private Totales totales(LocalDate fecha) {
        // Una consulta para los cobros (agrupados por medio de pago) y otra para los gastos
        BigDecimal efectivo = BigDecimal.ZERO, tarjeta = BigDecimal.ZERO, transferencia = BigDecimal.ZERO;
        long pagos = 0;
        for (Object[] f : pagoRepo.totalesPorMetodo(fecha.atStartOfDay(), fecha.plusDays(1).atStartOfDay())) {
            BigDecimal monto = cero((BigDecimal) f[1]);
            pagos += ((Number) f[2]).longValue();
            switch ((MetodoPago) f[0]) {
                case EFECTIVO -> efectivo = monto;
                case TARJETA -> tarjeta = monto;
                case TRANSFERENCIA -> transferencia = monto;
            }
        }
        return new Totales(efectivo, tarjeta, transferencia, cero(egresoRepo.sumMontoByFecha(fecha)), pagos);
    }

    /** El cambio con el que arranca el día: lo que se dejó en la caja en el último cierre anterior */
    BigDecimal fondoInicial(LocalDate fecha) {
        return cierreRepo.findFirstByFechaBeforeOrderByFechaDesc(fecha)
                .map(c -> cero(c.getDejaEnCaja()))
                .orElse(BigDecimal.ZERO);
    }

    /** Efectivo que debería haber en la caja */
    static BigDecimal esperado(BigDecimal fondo, BigDecimal efectivo, BigDecimal egresos) {
        return fondo.add(efectivo).subtract(egresos);
    }

    /** Resumen del día (sin guardar) — se llama durante el día para ver el estado */
    public CierreCajaResponseDTO resumenDia(LocalDate fecha) {
        var guardado = cierreRepo.findByFecha(fecha);
        if (guardado.isPresent()) return mapear(guardado.get());

        Totales t = totales(fecha);
        BigDecimal fondo = fondoInicial(fecha);

        CierreCajaResponseDTO dto = new CierreCajaResponseDTO();
        dto.setFecha(fecha);
        dto.setFondoInicial(fondo);
        dto.setTotalEfectivo(t.efectivo());
        dto.setTotalTarjeta(t.tarjeta());
        dto.setTotalTransferencia(t.transferencia());
        dto.setTotalIngresos(t.efectivo().add(t.tarjeta()).add(t.transferencia()));
        dto.setTotalEgresos(t.egresos());
        dto.setBalanceCalculado(esperado(fondo, t.efectivo(), t.egresos()));
        dto.setCantidadPagos((int) t.pagos());
        dto.setCerrada(false);
        return dto;
    }

    /** Guardar el cierre de caja del día */
    @Transactional
    public CierreCajaResponseDTO cerrar(CierreCajaRequestDTO req, String usuario) {
        LocalDate fecha = req.getFecha() != null ? req.getFecha() : LocalDate.now();
        if (fecha.isAfter(LocalDate.now())) throw new IllegalStateException("No se puede cerrar la caja de un día que todavía no llegó.");
        if (cierreRepo.existsByFecha(fecha)) {
            throw new IllegalStateException("La caja del " + fecha + " ya fue cerrada.");
        }
        if (req.getMontoContado() != null && req.getMontoContado().signum() < 0) {
            throw new IllegalStateException("El monto contado no puede ser negativo.");
        }

        Totales t = totales(fecha);
        BigDecimal fondo = fondoInicial(fecha);
        BigDecimal balanceCalculado = esperado(fondo, t.efectivo(), t.egresos());
        BigDecimal diferencia = req.getMontoContado() != null
                ? req.getMontoContado().subtract(balanceCalculado)
                : null;

        // Lo que queda en la caja para el día siguiente (no puede ser más de lo que hay)
        BigDecimal hay = req.getMontoContado() != null ? req.getMontoContado() : balanceCalculado.max(BigDecimal.ZERO);
        BigDecimal deja = req.getDejaEnCaja();
        if (deja != null && deja.signum() < 0) throw new IllegalStateException("Lo que queda en caja no puede ser negativo.");
        if (deja != null && deja.compareTo(hay) > 0) throw new IllegalStateException("No podés dejar en caja más de lo que hay ($" + hay.toPlainString() + ").");

        CierreCaja cierre = new CierreCaja();
        cierre.setFecha(fecha);
        cierre.setFondoInicial(fondo);
        cierre.setTotalEfectivo(t.efectivo());
        cierre.setTotalTarjeta(t.tarjeta());
        cierre.setTotalTransferencia(t.transferencia());
        cierre.setTotalEgresos(t.egresos());
        cierre.setBalanceCalculado(balanceCalculado);
        cierre.setMontoContado(req.getMontoContado());
        cierre.setDiferencia(diferencia);
        cierre.setDejaEnCaja(deja != null ? deja : BigDecimal.ZERO);
        cierre.setCantidadPagos((int) t.pagos());
        cierre.setObservaciones(req.getObservaciones() == null || req.getObservaciones().isBlank() ? null : req.getObservaciones().trim());
        cierre.setCreadoPor(usuario);

        return mapear(cierreRepo.save(cierre));
    }

    /** Días anteriores a hoy con movimientos (pagos o gastos) que quedaron sin cerrar */
    public List<LocalDate> pendientes() {
        // Tres consultas para todo el período (antes eran cinco por cada día)
        LocalDate hoy = LocalDate.now();
        LocalDate desde = hoy.minusDays(DIAS_PENDIENTES);
        LocalDate hasta = hoy.minusDays(1);
        java.util.Set<LocalDate> cerrados = new java.util.HashSet<>(cierreRepo.fechasCerradas(desde, hasta));
        java.util.Set<LocalDate> conMovimientos = new java.util.TreeSet<>(egresoRepo.fechasConGastos(desde, hasta));
        pagoRepo.fechasCompletados(desde.atStartOfDay(), hoy.atStartOfDay()).forEach(f -> conMovimientos.add(f.toLocalDate()));
        conMovimientos.removeAll(cerrados);
        return new ArrayList<>(conMovimientos);
    }

    /** Historial de todos los cierres */
    public List<CierreCajaResponseDTO> historial() {
        return cierreRepo.findAllByOrderByFechaDesc()
                .stream().map(this::mapear).toList();
    }

    private CierreCajaResponseDTO mapear(CierreCaja c) {
        BigDecimal total = c.getTotalEfectivo()
                .add(c.getTotalTarjeta())
                .add(c.getTotalTransferencia());

        CierreCajaResponseDTO dto = new CierreCajaResponseDTO();
        dto.setId(c.getId());
        dto.setFecha(c.getFecha());
        dto.setFondoInicial(cero(c.getFondoInicial()));
        dto.setTotalEfectivo(c.getTotalEfectivo());
        dto.setTotalTarjeta(c.getTotalTarjeta());
        dto.setTotalTransferencia(c.getTotalTransferencia());
        dto.setTotalIngresos(total);
        dto.setTotalEgresos(c.getTotalEgresos());
        dto.setBalanceCalculado(c.getBalanceCalculado());
        dto.setMontoContado(c.getMontoContado());
        dto.setDiferencia(c.getDiferencia());
        dto.setDejaEnCaja(c.getDejaEnCaja());
        // Lo que se retiró de la caja al cerrar
        BigDecimal hay = c.getMontoContado() != null ? c.getMontoContado() : c.getBalanceCalculado();
        dto.setRetiro(c.getDejaEnCaja() == null ? null : hay.subtract(c.getDejaEnCaja()).max(BigDecimal.ZERO));
        dto.setCantidadPagos(c.getCantidadPagos());
        dto.setObservaciones(c.getObservaciones());
        dto.setCreadoPor(c.getCreadoPor());
        dto.setCreatedAt(c.getCreatedAt());
        dto.setCerrada(true);
        return dto;
    }
}
