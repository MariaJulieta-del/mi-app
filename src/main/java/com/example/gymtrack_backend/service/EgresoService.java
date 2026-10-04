package com.example.gymtrack_backend.service;

import com.example.gymtrack_backend.dto.EgresoRequestDTO;
import com.example.gymtrack_backend.dto.EgresoResponseDTO;
import com.example.gymtrack_backend.entities.Egreso;
import com.example.gymtrack_backend.repository.EgresoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EgresoService {

    private final EgresoRepository egresoRepo;

    public List<EgresoResponseDTO> listarHoy() {
        return egresoRepo.findByFechaOrderByCreatedAtDesc(LocalDate.now())
                .stream().map(this::mapear).toList();
    }

    public List<EgresoResponseDTO> listarPorRango(LocalDate desde, LocalDate hasta) {
        return egresoRepo.findByFechaBetweenOrderByFechaDescCreatedAtDesc(desde, hasta)
                .stream().map(this::mapear).toList();
    }

    public List<EgresoResponseDTO> listarTodos() {
        return egresoRepo.findAll()
                .stream()
                .sorted((a, b) -> b.getFecha().compareTo(a.getFecha()))
                .map(this::mapear).toList();
    }

    public EgresoResponseDTO registrar(EgresoRequestDTO dto) {
        Egreso e = new Egreso();
        e.setFecha(dto.getFecha() != null ? dto.getFecha() : LocalDate.now());
        e.setDescripcion(dto.getDescripcion());
        e.setMonto(dto.getMonto());
        e.setCategoria(dto.getCategoria() != null ? dto.getCategoria().toUpperCase() : "VARIOS");
        e.setRegistradoPor(dto.getRegistradoPor());
        return mapear(egresoRepo.save(e));
    }

    public void eliminar(Long id) {
        egresoRepo.deleteById(id);
    }

    public BigDecimal totalHoy() {
        return egresoRepo.sumMontoByFecha(LocalDate.now());
    }

    public BigDecimal totalPorRango(LocalDate desde, LocalDate hasta) {
        return egresoRepo.sumMontoByFechaBetween(desde, hasta);
    }

    private EgresoResponseDTO mapear(Egreso e) {
        return new EgresoResponseDTO(
                e.getId(), e.getFecha(), e.getDescripcion(),
                e.getMonto(), e.getCategoria(), e.getRegistradoPor(), e.getCreatedAt()
        );
    }
}
