package com.example.gymtrack_backend.service;

import com.example.gymtrack_backend.dto.MaquinaEstadisticasDTO;
import com.example.gymtrack_backend.dto.MantenimientoRequestDTO;
import com.example.gymtrack_backend.dto.MantenimientoResponseDTO;
import com.example.gymtrack_backend.entities.Maquina;
import com.example.gymtrack_backend.entities.Mantenimiento;
import com.example.gymtrack_backend.entities.enums.TipoMantenimiento;
import com.example.gymtrack_backend.repository.MantenimientoRepository;
import com.example.gymtrack_backend.repository.MaquinaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MantenimientoService {

    private final MantenimientoRepository mantenimientoRepository;
    private final MaquinaRepository maquinaRepository;

    /** Registrar un nuevo mantenimiento */
    @Transactional
    public MantenimientoResponseDTO crear(MantenimientoRequestDTO dto) {
        Maquina maquina = maquinaRepository.findById(dto.getMaquinaId())
                .orElseThrow(() -> new RuntimeException("Máquina no encontrada: " + dto.getMaquinaId()));

        TipoMantenimiento tipo;
        try {
            tipo = TipoMantenimiento.valueOf(dto.getTipo().toUpperCase());
        } catch (Exception e) {
            throw new IllegalArgumentException("Tipo inválido: " + dto.getTipo() + ". Debe ser PENDIENTE o REALIZADO.");
        }

        Mantenimiento m = new Mantenimiento();
        m.setMaquina(maquina);
        m.setTipo(tipo);
        m.setDescripcion(dto.getDescripcion());
        m.setFechaMantenimiento(dto.getFechaMantenimiento());
        m.setTecnico(dto.getTecnico());
        m.setTelefonoTecnico(dto.getTelefonoTecnico());
        m.setCosto(dto.getCosto());
        m.setObservaciones(dto.getObservaciones());
        m.setFechaAlta(dto.getFechaAlta());

        return mapear(mantenimientoRepository.save(m));
    }

    /** Listar todos los mantenimientos */
    public List<MantenimientoResponseDTO> listarTodos() {
        return mantenimientoRepository.findAllByOrderByFechaMantenimientoDescFechaCreacionDesc()
                .stream().map(this::mapear).collect(Collectors.toList());
    }

    /** Listar mantenimientos de una máquina específica */
    public List<MantenimientoResponseDTO> listarPorMaquina(Long maquinaId) {
        return mantenimientoRepository
                .findByMaquinaIdOrderByFechaMantenimientoDescFechaCreacionDesc(maquinaId)
                .stream().map(this::mapear).collect(Collectors.toList());
    }

    /** Actualizar tipo (marcar como REALIZADO por ejemplo) */
    @Transactional
    public MantenimientoResponseDTO actualizar(Long id, MantenimientoRequestDTO dto) {
        Mantenimiento m = mantenimientoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Mantenimiento no encontrado: " + id));

        if (dto.getMaquinaId() != null) {
            Maquina maquina = maquinaRepository.findById(dto.getMaquinaId())
                    .orElseThrow(() -> new RuntimeException("Máquina no encontrada: " + dto.getMaquinaId()));
            m.setMaquina(maquina);
        }
        if (dto.getTipo() != null) {
            m.setTipo(TipoMantenimiento.valueOf(dto.getTipo().toUpperCase()));
        }
        if (dto.getDescripcion() != null) m.setDescripcion(dto.getDescripcion());
        if (dto.getFechaMantenimiento() != null) m.setFechaMantenimiento(dto.getFechaMantenimiento());
        if (dto.getTecnico() != null) m.setTecnico(dto.getTecnico());
        if (dto.getTelefonoTecnico() != null) m.setTelefonoTecnico(dto.getTelefonoTecnico());
        if (dto.getCosto() != null) m.setCosto(dto.getCosto());
        if (dto.getObservaciones() != null) m.setObservaciones(dto.getObservaciones());
        if (dto.getFechaAlta() != null) m.setFechaAlta(dto.getFechaAlta());

        return mapear(mantenimientoRepository.save(m));
    }

    /** Eliminar un mantenimiento */
    @Transactional
    public void eliminar(Long id) {
        if (!mantenimientoRepository.existsById(id)) {
            throw new RuntimeException("Mantenimiento no encontrado: " + id);
        }
        mantenimientoRepository.deleteById(id);
    }

    /** Estadísticas históricas de una máquina: reparaciones, costos, inactividad */
    public MaquinaEstadisticasDTO estadisticasPorMaquina(Long maquinaId) {
        Maquina maquina = maquinaRepository.findById(maquinaId)
                .orElseThrow(() -> new RuntimeException("Máquina no encontrada: " + maquinaId));

        List<Mantenimiento> historial = mantenimientoRepository
                .findByMaquinaIdOrderByFechaMantenimientoDescFechaCreacionDesc(maquinaId);

        List<Mantenimiento> realizados = historial.stream()
                .filter(m -> m.getTipo().name().equals("REALIZADO"))
                .collect(Collectors.toList());

        BigDecimal costoTotal = realizados.stream()
                .filter(m -> m.getCosto() != null)
                .map(Mantenimiento::getCosto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long diasTotal = realizados.stream()
                .filter(m -> m.getFechaMantenimiento() != null && m.getFechaAlta() != null)
                .mapToLong(m -> ChronoUnit.DAYS.between(m.getFechaMantenimiento(), m.getFechaAlta()))
                .filter(d -> d >= 0)
                .sum();

        long conFechas = realizados.stream()
                .filter(m -> m.getFechaMantenimiento() != null && m.getFechaAlta() != null)
                .count();

        double promedio = conFechas > 0 ? (double) diasTotal / conFechas : 0.0;

        return new MaquinaEstadisticasDTO(
                maquina.getId(),
                maquina.getNombre(),
                maquina.getNroMaquina(),
                realizados.size(),
                costoTotal,
                diasTotal,
                promedio
        );
    }

    private MantenimientoResponseDTO mapear(Mantenimiento m) {
        MantenimientoResponseDTO dto = new MantenimientoResponseDTO();
        dto.setId(m.getId());
        dto.setMaquinaId(m.getMaquina().getId());
        dto.setMaquinaNombre(m.getMaquina().getNombre());
        dto.setMaquinaNroMaquina(m.getMaquina().getNroMaquina());
        dto.setTipo(m.getTipo().name());
        dto.setDescripcion(m.getDescripcion());
        dto.setFechaMantenimiento(m.getFechaMantenimiento());
        dto.setTecnico(m.getTecnico());
        dto.setTelefonoTecnico(m.getTelefonoTecnico());
        dto.setCosto(m.getCosto());
        dto.setObservaciones(m.getObservaciones());
        dto.setFechaCreacion(m.getFechaCreacion());
        dto.setFechaAlta(m.getFechaAlta());
        // Calcular días de inactividad si ambas fechas están presentes
        if (m.getFechaMantenimiento() != null && m.getFechaAlta() != null) {
            long dias = ChronoUnit.DAYS.between(m.getFechaMantenimiento(), m.getFechaAlta());
            dto.setDiasInactividad(dias >= 0 ? dias : null);
        }
        return dto;
    }
}
