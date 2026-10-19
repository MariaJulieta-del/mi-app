package com.example.gymtrack_backend.service;

import com.example.gymtrack_backend.dto.TarifaMembresiaResponseDTO;
import com.example.gymtrack_backend.entities.TarifaMembresia;
import com.example.gymtrack_backend.repository.MembresiaRepository;
import com.example.gymtrack_backend.repository.TarifaMembresiaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TarifaMembresiaService {

    @Autowired
    private TarifaMembresiaRepository repository;

    @Autowired
    private MembresiaRepository membresiaRepository;

    /** Lista todos los planes con conteo de socios activos */
    public List<TarifaMembresiaResponseDTO> listarTodas() {
        // [plan, membresías, activas] de todos los planes en una sola consulta
        java.util.Map<String, Object[]> resumen = new java.util.HashMap<>();
        for (Object[] f : membresiaRepository.resumenPorPlan()) resumen.put((String) f[0], f);
        return repository.findAll().stream()
                .map(t -> {
                    TarifaMembresiaResponseDTO dto = toDTO(t, false);
                    Object[] f = resumen.get(t.getTipo());
                    dto.setSociosActivos(f == null || f[2] == null ? 0L : ((Number) f[2]).longValue());
                    dto.setUsado(f != null && ((Number) f[1]).longValue() > 0);
                    return dto;
                })
                .collect(Collectors.toList());
    }

    /** Crea un nuevo plan de membresía */
    @Transactional
    public TarifaMembresiaResponseDTO crearPlan(TarifaMembresia plan) {
        String tipo = plan.getTipo().toUpperCase().replace(" ", "_");
        if (repository.existsById(tipo)) {
            throw new RuntimeException("Ya existe un plan con el tipo: " + tipo);
        }
        plan.setTipo(tipo);
        return toDTO(repository.save(plan));
    }

    /**
     * Actualiza precio y/o pases mensuales de un plan.
     * Los cambios aplican a los socios cuando renuevan (la membresía guarda los valores pagados).
     */
    @Transactional
    public TarifaMembresiaResponseDTO actualizar(String tipo, BigDecimal nuevoPrecio,
                                                 boolean cambiaPases, Integer pasesMensuales) {
        return actualizar(tipo, nuevoPrecio, cambiaPases, pasesMensuales, null, null);
    }

    /** Igual que arriba, y además nombre y "qué incluye" (null = no se cambia) */
    @Transactional
    public TarifaMembresiaResponseDTO actualizar(String tipo, BigDecimal nuevoPrecio, boolean cambiaPases,
                                                 Integer pasesMensuales, String nombre, String incluye) {
        TarifaMembresia tarifa = repository.findById(tipo.toUpperCase())
                .orElseThrow(() -> new com.example.gymtrack_backend.web.RecursoNoEncontradoException("Plan no encontrado: " + tipo));
        if (nombre != null && !nombre.isBlank()) tarifa.setNombre(nombre.trim());
        if (incluye != null) tarifa.setIncluye(incluye.isBlank() ? null : incluye.trim());
        if (nuevoPrecio != null) {
            if (nuevoPrecio.signum() <= 0) throw new IllegalArgumentException("El precio tiene que ser mayor a cero");
            tarifa.setPrecio(nuevoPrecio);
        }
        if (cambiaPases) tarifa.setPasesMensuales(pasesMensuales);
        return toDTO(repository.save(tarifa));
    }

    /** Habilita o deshabilita un plan (deshabilitado = no se ofrece al cobrar) */
    @Transactional
    public TarifaMembresiaResponseDTO cambiarActivo(String tipo, boolean activo) {
        TarifaMembresia t = repository.findById(tipo.toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Plan no encontrado: " + tipo));
        if (!activo && repository.findAll().stream().filter(x -> !Boolean.FALSE.equals(x.getActivo())).count() <= 1) {
            throw new IllegalStateException("Tiene que quedar al menos un plan habilitado para poder cobrar.");
        }
        t.setActivo(activo);
        return toDTO(repository.save(t));
    }

    /** Borra un plan que nunca se usó (si alguien lo tuvo, solo se puede deshabilitar) */
    @Transactional
    public void eliminar(String tipo) {
        TarifaMembresia t = repository.findById(tipo.toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Plan no encontrado: " + tipo));
        if (membresiaRepository.existsByTipoMembresia(t.getTipo())) {
            throw new IllegalStateException("Este plan ya lo usaron socios: deshabilitalo en lugar de borrarlo.");
        }
        if (repository.count() <= 1) throw new IllegalStateException("Tiene que quedar al menos un plan.");
        repository.delete(t);
    }

    /** Obtiene el precio de un plan */
    public BigDecimal getPrecio(String tipo) {
        return repository.findById(tipo.toUpperCase())
                .map(TarifaMembresia::getPrecio)
                .orElseThrow(() -> new com.example.gymtrack_backend.web.RecursoNoEncontradoException("Plan no encontrado: " + tipo));
    }

    private TarifaMembresiaResponseDTO toDTO(TarifaMembresia t) {
        return toDTO(t, true);
    }

    private TarifaMembresiaResponseDTO toDTO(TarifaMembresia t, boolean conConteos) {
        TarifaMembresiaResponseDTO dto = new TarifaMembresiaResponseDTO();
        dto.setTipo(t.getTipo());
        dto.setNombre(t.getNombre() != null ? t.getNombre() : t.getTipo());
        dto.setPrecio(t.getPrecio());
        dto.setDuracionDias(t.getDuracionDias());
        dto.setPasesMensuales(t.getPasesMensuales());
        dto.setDescripcion(t.getDescripcion());
        dto.setIncluye(t.getIncluye());
        dto.setActivo(!Boolean.FALSE.equals(t.getActivo()));
        if (conConteos) {
            dto.setSociosActivos(membresiaRepository.countActivosByTipo(t.getTipo()));
            dto.setUsado(membresiaRepository.existsByTipoMembresia(t.getTipo()));
        }
        return dto;
    }
}
