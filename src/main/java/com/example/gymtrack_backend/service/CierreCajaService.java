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
import java.util.List;

@Service
@RequiredArgsConstructor
public class CierreCajaService {

    private final CierreCajaRepository cierreRepo;
    private final PagoRepository pagoRepo;
    private final EgresoRepository egresoRepo;

    /** Resumen del día (sin guardar) — se llama durante el día para ver el estado */
    public CierreCajaResponseDTO resumenDia(LocalDate fecha) {
        LocalDateTime desde = fecha.atStartOfDay();
        LocalDateTime hasta = fecha.atTime(LocalTime.MAX);

        BigDecimal efectivo     = pagoRepo.sumByMetodoAndFecha(MetodoPago.EFECTIVO,      desde, hasta);
        BigDecimal tarjeta      = pagoRepo.sumByMetodoAndFecha(MetodoPago.TARJETA,       desde, hasta);
        BigDecimal transferencia= pagoRepo.sumByMetodoAndFecha(MetodoPago.TRANSFERENCIA, desde, hasta);
        BigDecimal egresos      = egresoRepo.sumMontoByFecha(fecha);
        long cantPagos          = pagoRepo.countCompletadosByFecha(desde, hasta);

        if (efectivo == null)      efectivo      = BigDecimal.ZERO;
        if (tarjeta == null)       tarjeta       = BigDecimal.ZERO;
        if (transferencia == null) transferencia = BigDecimal.ZERO;
        if (egresos == null)       egresos       = BigDecimal.ZERO;

        BigDecimal totalIngresos    = efectivo.add(tarjeta).add(transferencia);
        // Sin módulo de egresos: el balance en caja física = todo lo que entró en efectivo
        BigDecimal balanceCalculado = efectivo;

        boolean cerrada = cierreRepo.existsByFecha(fecha);

        CierreCajaResponseDTO dto = new CierreCajaResponseDTO();
        dto.setFecha(fecha);
        dto.setTotalEfectivo(efectivo);
        dto.setTotalTarjeta(tarjeta);
        dto.setTotalTransferencia(transferencia);
        dto.setTotalIngresos(totalIngresos);
        dto.setTotalEgresos(egresos);
        dto.setBalanceCalculado(balanceCalculado);
        dto.setCantidadPagos((int) cantPagos);
        dto.setCerrada(cerrada);

        // Si ya fue cerrada, incluir los datos del cierre
        if (cerrada) {
            cierreRepo.findByFecha(fecha).ifPresent(c -> {
                dto.setId(c.getId());
                dto.setMontoContado(c.getMontoContado());
                dto.setDiferencia(c.getDiferencia());
                dto.setObservaciones(c.getObservaciones());
                dto.setCreadoPor(c.getCreadoPor());
                dto.setCreatedAt(c.getCreatedAt());
            });
        }

        return dto;
    }

    /** Guardar el cierre de caja del día */
    @Transactional
    public CierreCajaResponseDTO cerrar(CierreCajaRequestDTO req) {
        LocalDate fecha = req.getFecha() != null ? req.getFecha() : LocalDate.now();

        if (cierreRepo.existsByFecha(fecha)) {
            throw new IllegalStateException("La caja del " + fecha + " ya fue cerrada.");
        }

        // Calcular totales
        LocalDateTime desde = fecha.atStartOfDay();
        LocalDateTime hasta = fecha.atTime(LocalTime.MAX);

        BigDecimal efectivo      = pagoRepo.sumByMetodoAndFecha(MetodoPago.EFECTIVO,      desde, hasta);
        BigDecimal tarjeta       = pagoRepo.sumByMetodoAndFecha(MetodoPago.TARJETA,       desde, hasta);
        BigDecimal transferencia = pagoRepo.sumByMetodoAndFecha(MetodoPago.TRANSFERENCIA, desde, hasta);
        BigDecimal egresos       = egresoRepo.sumMontoByFecha(fecha);
        long cantPagos           = pagoRepo.countCompletadosByFecha(desde, hasta);

        if (efectivo == null)      efectivo      = BigDecimal.ZERO;
        if (tarjeta == null)       tarjeta       = BigDecimal.ZERO;
        if (transferencia == null) transferencia = BigDecimal.ZERO;
        if (egresos == null)       egresos       = BigDecimal.ZERO;

        BigDecimal balanceCalculado = efectivo;
        BigDecimal diferencia = req.getMontoContado() != null
                ? req.getMontoContado().subtract(balanceCalculado)
                : null;

        CierreCaja cierre = new CierreCaja();
        cierre.setFecha(fecha);
        cierre.setTotalEfectivo(efectivo);
        cierre.setTotalTarjeta(tarjeta);
        cierre.setTotalTransferencia(transferencia);
        cierre.setTotalEgresos(egresos);
        cierre.setBalanceCalculado(balanceCalculado);
        cierre.setMontoContado(req.getMontoContado());
        cierre.setDiferencia(diferencia);
        cierre.setCantidadPagos((int) cantPagos);
        cierre.setObservaciones(req.getObservaciones());
        cierre.setCreadoPor(req.getCreadoPor());

        CierreCaja guardado = cierreRepo.save(cierre);
        return mapear(guardado);
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
        dto.setTotalEfectivo(c.getTotalEfectivo());
        dto.setTotalTarjeta(c.getTotalTarjeta());
        dto.setTotalTransferencia(c.getTotalTransferencia());
        dto.setTotalIngresos(total);
        dto.setTotalEgresos(c.getTotalEgresos());
        dto.setBalanceCalculado(c.getBalanceCalculado());
        dto.setMontoContado(c.getMontoContado());
        dto.setDiferencia(c.getDiferencia());
        dto.setCantidadPagos(c.getCantidadPagos());
        dto.setObservaciones(c.getObservaciones());
        dto.setCreadoPor(c.getCreadoPor());
        dto.setCreatedAt(c.getCreatedAt());
        dto.setCerrada(true);
        return dto;
    }
}
