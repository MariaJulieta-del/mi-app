package com.example.gymtrack_backend.web;

import com.example.gymtrack_backend.entities.enums.EstadoMembresia;
import com.example.gymtrack_backend.entities.enums.EstadoPago;
import com.example.gymtrack_backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.Period;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/**
 * Endpoints de reportes y estadísticas para el Dashboard.
 */
@RestController
@RequestMapping("/api/v1/reportes")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ReporteController {

    private final SocioRepository      socioRepo;
    private final MembresiaRepository  membresiaRepo;
    private final PagoRepository       pagoRepo;
    private final AsistenciaRepository asistenciaRepo;
    private final com.example.gymtrack_backend.service.MetricasService metricasService;
    private final com.example.gymtrack_backend.service.DemografiaService demografiaService;

    /**
     * Estadísticas principales del Dashboard:
     *  - total socios activos
     *  - membresías activas
     *  - membresías vencidas
     *  - total recaudado este mes
     *  - asistentes hoy
     */
    /** Indicadores del dueño: ingreso recurrente, bajas, valor por socio y retención por mes de alta */
    @GetMapping("/indicadores")
    public com.example.gymtrack_backend.service.MetricasService.Indicadores indicadores() {
        return metricasService.indicadores();
    }

    /** Público del gimnasio: edad y género de los socios y a qué hora viene cada grupo */
    @GetMapping("/demografia")
    public com.example.gymtrack_backend.service.DemografiaService.Demografia demografia(@RequestParam(defaultValue = "60") int dias) {
        return demografiaService.demografia(dias);
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> dashboard() {
        LocalDate hoy      = LocalDate.now();
        LocalDate inicioMes = hoy.withDayOfMonth(1);

        long totalSocios      = socioRepo.countByActivoTrue();
        long membresiasActivas = membresiaRepo.findByEstadoMembresia(EstadoMembresia.ACTIVA).size();
        long membresiasVencidas = membresiaRepo.findByEstadoMembresia(EstadoMembresia.VENCIDA).size();

        // Total recaudado este mes (pagos COMPLETADOS)
        double recaudadoMes = pagoRepo.findAll().stream()
                .filter(p -> p.getEstadoPago() == EstadoPago.COMPLETADO)
                .filter(p -> !p.getFechaPago().toLocalDate().isBefore(inicioMes))
                .mapToDouble(p -> p.getMonto().doubleValue())
                .sum();

        long asistentesHoy = asistenciaRepo.countSociosHoy(hoy);

        return ResponseEntity.ok(Map.of(
                "totalSociosActivos",    totalSocios,
                "membresiasActivas",     membresiasActivas,
                "membresiasVencidas",    membresiasVencidas,
                "totalRecaudadoMes",     recaudadoMes,
                "asistentesHoy",         asistentesHoy,
                "mesReporte",            hoy.getMonth().getDisplayName(java.time.format.TextStyle.FULL, java.util.Locale.of("es", "AR")) + " " + hoy.getYear()
        ));
    }

    /**
     * Reporte de ingresos por mes: suma de pagos COMPLETADOS agrupados por mes.
     */
    @GetMapping("/ingresos")
    public ResponseEntity<Object> ingresos(
            @RequestParam(defaultValue = "6") int meses) {
        // Simplificado: retorna totales de los últimos N meses
        LocalDate desde = LocalDate.now().minusMonths(meses).withDayOfMonth(1);

        var pagos = pagoRepo.findAll().stream()
                .filter(p -> p.getEstadoPago() == EstadoPago.COMPLETADO)
                .filter(p -> !p.getFechaPago().toLocalDate().isBefore(desde))
                .toList();

        // Agrupar por mes y devolver como lista ordenada [ {mes, total} ]
        var porMes = pagos.stream().collect(
                java.util.stream.Collectors.groupingBy(
                        p -> p.getFechaPago().getYear() + "-" + String.format("%02d", p.getFechaPago().getMonthValue()),
                        java.util.stream.Collectors.summingDouble(p -> p.getMonto().doubleValue())
                )
        );

        var lista = porMes.entrySet().stream()
                .sorted(java.util.Map.Entry.comparingByKey())
                .map(e -> java.util.Map.of("mes", e.getKey(), "total", e.getValue()))
                .toList();

        return ResponseEntity.ok(lista);
    }

    /**
     * Reporte de asistencias por rango de fechas.
     */
    @GetMapping("/asistencias")
    public ResponseEntity<Object> asistencias(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {

        var asistencias = asistenciaRepo
                .findByFechaBetweenOrderByFechaDescHoraDesc(desde, hasta);

        // Agrupar por fecha y devolver como lista ordenada [ {fecha, total} ]
        var porFecha = asistencias.stream().collect(
                java.util.stream.Collectors.groupingBy(
                        a -> a.getFecha().toString(),
                        java.util.stream.Collectors.counting()
                )
        );

        var lista = porFecha.entrySet().stream()
                .sorted(java.util.Map.Entry.comparingByKey())
                .map(e -> java.util.Map.of("fecha", e.getKey(), "total", e.getValue()))
                .toList();

        return ResponseEntity.ok(lista);
    }

    /**
     * Socios con membresía ACTIVA próxima a vencer (dentro de N días).
     */
    @GetMapping("/proximos-a-vencer")
    public ResponseEntity<List<Map<String, Object>>> proximosAVencer(
            @RequestParam(defaultValue = "15") int dias) {
        LocalDate hoy    = LocalDate.now();
        LocalDate limite = hoy.plusDays(dias);

        var resultado = membresiaRepo
                .findByEstadoMembresiaAndFechaVencimientoBetween(EstadoMembresia.ACTIVA, hoy, limite)
                .stream()
                .map(m -> {
                    long restantes = ChronoUnit.DAYS.between(hoy, m.getFechaVencimiento());
                    Map<String, Object> item = new java.util.LinkedHashMap<>();
                    item.put("socioId",          m.getSocio().getId());
                    item.put("nombre",           m.getSocio().getNombre() + " " + m.getSocio().getApellido());
                    item.put("dni",              m.getSocio().getDni());
                    item.put("tipoMembresia",    m.getTipoMembresia());
                    item.put("fechaVencimiento", m.getFechaVencimiento().toString());
                    item.put("diasRestantes",    restantes);
                    return item;
                })
                .sorted(java.util.Comparator.comparingLong(m -> (long) m.get("diasRestantes")))
                .toList();

        return ResponseEntity.ok(resultado);
    }

    /**
     * Socios con la membresía VENCIDA (tienen que renovar).
     */
    @GetMapping("/morosos")
    public ResponseEntity<List<Map<String, Object>>> morosos() {
        var resultado = membresiaRepo
                .findByEstadoMembresiaIn(List.of(EstadoMembresia.VENCIDA))
                .stream()
                .map(m -> {
                    Map<String, Object> item = new java.util.LinkedHashMap<>();
                    item.put("socioId",          m.getSocio().getId());
                    item.put("nombre",           m.getSocio().getNombre() + " " + m.getSocio().getApellido());
                    item.put("dni",              m.getSocio().getDni());
                    item.put("tipoMembresia",    m.getTipoMembresia());
                    item.put("estado",           m.getEstadoMembresia().toString());
                    item.put("precio",           m.getPrecio());
                    item.put("fechaVencimiento", m.getFechaVencimiento().toString());
                    return item;
                })
                .toList();

        return ResponseEntity.ok(resultado);
    }

    /**
     * Distribución de edades de los socios activos, agrupadas en rangos de 10 años.
     * Devuelve [ {rango, cantidad} ] — solo socios con fechaNacimiento cargada.
     */
    @GetMapping("/edades")
    public ResponseEntity<List<Map<String, Object>>> distribucionEdades() {
        LocalDate hoy = LocalDate.now();

        // Calcular edad de cada socio activo que tenga fechaNacimiento
        Map<String, Long> porRango = new TreeMap<>();

        socioRepo.findAll().stream()
                .filter(s -> s.getActivo() != null && s.getActivo())
                .filter(s -> s.getFechaNacimiento() != null)
                .forEach(s -> {
                    int edad = Period.between(s.getFechaNacimiento(), hoy).getYears();
                    // Agrupar en rangos: "10-19", "20-29", etc.
                    int base = (edad / 10) * 10;
                    String rango = base + "-" + (base + 9);
                    porRango.merge(rango, 1L, Long::sum);
                });

        var lista = porRango.entrySet().stream()
                .map(e -> {
                    Map<String, Object> item = new java.util.LinkedHashMap<>();
                    item.put("rango", e.getKey());
                    item.put("cantidad", e.getValue());
                    return item;
                })
                .toList();

        return ResponseEntity.ok(lista);
    }

    /**
     * Socios activos sin asistencias en los últimos N días (riesgo de abandono).
     */
    @GetMapping("/sin-asistencias")
    public ResponseEntity<List<Map<String, Object>>> sinAsistencias(
            @RequestParam(defaultValue = "14") int dias) {
        LocalDate desde = LocalDate.now().minusDays(dias);

        var resultado = socioRepo.findActivosSinAsistenciaDesde(desde)
                .stream()
                .map(s -> {
                    // Buscar la última asistencia del socio (si existe alguna anterior)
                    var historial = asistenciaRepo.findBySocioIdOrderByFechaDescHoraDesc(s.getId());
                    String ultimaAsistencia = historial.isEmpty()
                            ? "Nunca"
                            : historial.get(0).getFecha().toString();
                    Map<String, Object> item = new java.util.LinkedHashMap<>();
                    item.put("socioId",           s.getId());
                    item.put("nombre",            s.getNombre() + " " + s.getApellido());
                    item.put("dni",               s.getDni());
                    item.put("ultimaAsistencia",  ultimaAsistencia);
                    return item;
                })
                .toList();

        return ResponseEntity.ok(resultado);
    }

    /** Socios con membresía vigente que dejaron de venir o están por vencer sin venir */
    @GetMapping("/en-riesgo")
    public ResponseEntity<List<com.example.gymtrack_backend.service.MetricasService.SocioEnRiesgo>> enRiesgo() {
        return ResponseEntity.ok(metricasService.enRiesgo());
    }

    /** Retención mensual, ingreso promedio por socio y ocupación por horario */
    @GetMapping("/metricas")
    public ResponseEntity<com.example.gymtrack_backend.service.MetricasService.Metricas> metricas() {
        return ResponseEntity.ok(metricasService.metricas());
    }
}
