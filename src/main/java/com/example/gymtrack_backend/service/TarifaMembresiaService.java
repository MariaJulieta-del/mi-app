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
        return repository.findAll().stream()
                .map(this::toDTO)
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
        TarifaMembresia tarifa = repository.findById(tipo.toUpperCase())
                .orElseThrow(() -> new RuntimeException("Plan no encontrado: " + tipo));
        if (nuevoPrecio != null) tarifa.setPrecio(nuevoPrecio);
        if (cambiaPases) tarifa.setPasesMensuales(pasesMensuales);
        return toDTO(repository.save(tarifa));
    }

    /** Obtiene el precio de un plan */
    public BigDecimal getPrecio(String tipo) {
        return repository.findById(tipo.toUpperCase())
                .map(TarifaMembresia::getPrecio)
                .orElseThrow(() -> new RuntimeException("Plan no encontrado: " + tipo));
    }

    private TarifaMembresiaResponseDTO toDTO(TarifaMembresia t) {
        TarifaMembresiaResponseDTO dto = new TarifaMembresiaResponseDTO();
        dto.setTipo(t.getTipo());
        dto.setNombre(t.getNombre() != null ? t.getNombre() : t.getTipo());
        dto.setPrecio(t.getPrecio());
        dto.setDuracionDias(t.getDuracionDias());
        dto.setPasesMensuales(t.getPasesMensuales());
        dto.setDescripcion(t.getDescripcion());
        dto.setIncluye(t.getIncluye());
        dto.setSociosActivos(membresiaRepository.countActivosByTipo(t.getTipo()));
        return dto;
    }
}
