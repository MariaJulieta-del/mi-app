package com.example.gymtrack_backend.service;

import com.example.gymtrack_backend.dto.PagoConMembresiaRequestDTO;
import com.example.gymtrack_backend.dto.PagoResponseDTO;
import com.example.gymtrack_backend.entities.Membresia;
import com.example.gymtrack_backend.entities.Pago;
import com.example.gymtrack_backend.entities.enums.EstadoPago;
import com.example.gymtrack_backend.repository.PagoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PagoService {

    @Autowired
    private PagoRepository pagoRepository;

    @Autowired
    private MembresiaService membresiaService;

    // ──────────────────────────────────────────────
    // COBRAR PLAN = crear o renovar la membresía del socio
    // ──────────────────────────────────────────────

    /**
     * Renueva (o crea) la membresía del socio con el plan elegido y registra
     * el pago en una única transacción. El precio y los pases salen del tarifario.
     */
    @Transactional
    public PagoResponseDTO registrarConMembresia(PagoConMembresiaRequestDTO dto) {
        Membresia membresia = membresiaService.renovar(dto.getSocioId(), dto.getPlanTipo());

        // Registra el pago asociado
        Pago pago = new Pago();
        pago.setMembresia(membresia);
        pago.setMonto(membresia.getPrecio());
        pago.setMetodoPago(dto.getMetodoPago());
        pago.setEstadoPago(EstadoPago.COMPLETADO);
        pago.setObservaciones(dto.getObservaciones());

        com.example.gymtrack_backend.auditoria.AuditoriaInterceptor.socio(dto.getSocioId());
        com.example.gymtrack_backend.auditoria.AuditoriaInterceptor.detalle(
                membresia.getTipoMembresia() + " · $" + membresia.getPrecio() + " · " + dto.getMetodoPago()
                + " · vence " + membresia.getFechaVencimiento());
        return mapearAResponseDTO(pagoRepository.save(pago));
    }

    // ──────────────────────────────────────────────
    // LISTAR
    // ──────────────────────────────────────────────

    /** Lista todos los pagos */
    public List<PagoResponseDTO> listarTodos() {
        return pagoRepository.findAll()
            .stream().map(this::mapearAResponseDTO).collect(Collectors.toList());
    }

    /** Historial de pagos de una membresía específica */
    public List<PagoResponseDTO> obtenerPorMembresia(Long membresiaId) {
        return pagoRepository.findByMembresiaIdOrderByFechaPagoDesc(membresiaId)
            .stream().map(this::mapearAResponseDTO).collect(Collectors.toList());
    }

    // ──────────────────────────────────────────────
    // HELPER
    // ──────────────────────────────────────────────

    private PagoResponseDTO mapearAResponseDTO(Pago p) {
        PagoResponseDTO dto = new PagoResponseDTO();
        dto.setId(p.getId());

        if (p.getMembresia() != null) {
            dto.setMembresiaId(p.getMembresia().getId());
            dto.setTipoMembresia(p.getMembresia().getTipoMembresia());
            dto.setEstadoMembresia(p.getMembresia().getEstadoMembresia());

            if (p.getMembresia().getSocio() != null) {
                dto.setSocioId(p.getMembresia().getSocio().getId());
                dto.setSocioNombre(p.getMembresia().getSocio().getNombre()
                    + " " + p.getMembresia().getSocio().getApellido());
            } else {
                dto.setSocioNombre("Socio eliminado");
            }
        }

        dto.setMonto(p.getMonto());
        dto.setMetodoPago(p.getMetodoPago());
        dto.setEstadoPago(p.getEstadoPago());
        dto.setFechaPago(p.getFechaPago());
        dto.setObservaciones(p.getObservaciones());
        return dto;
    }
}
