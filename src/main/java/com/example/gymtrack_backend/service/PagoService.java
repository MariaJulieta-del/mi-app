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
    @Autowired
    private com.example.gymtrack_backend.repository.SocioRepository socioRepository;

    /** Un mismo cobro repetido dentro de este tiempo se toma como doble clic */
    static final int SEGUNDOS_DOBLE_COBRO = 20;

    @Transactional
    public PagoResponseDTO registrarConMembresia(PagoConMembresiaRequestDTO dto) {
        return registrarConMembresia(dto, null);
    }

    /**
     * Cobro idempotente:
     *  - Se bloquea al socio mientras dura el cobro, así dos pedidos simultáneos se hacen de a uno.
     *  - Si llega la misma clave (el mismo intento desde la pantalla), se devuelve el pago ya hecho.
     *  - Sin clave: el mismo plan y medio para el mismo socio en los últimos segundos es un doble clic.
     */
    @Transactional
    public PagoResponseDTO registrarConMembresia(PagoConMembresiaRequestDTO dto, String clave) {
        String k = clave == null || clave.isBlank() ? null : clave.trim();
        if (k != null && k.length() > 64) throw new IllegalArgumentException("Clave de cobro inválida");
        socioRepository.bloquear(dto.getSocioId())
                .orElseThrow(() -> new com.example.gymtrack_backend.web.RecursoNoEncontradoException("Socio no encontrado"));
        if (k != null) {
            var previo = pagoRepository.findByClaveIdempotencia(k);
            if (previo.isPresent()) return mapearAResponseDTO(previo.get());
        } else {
            var dobleClic = pagoRepository.recientesDelSocio(dto.getSocioId(), java.time.LocalDateTime.now().minusSeconds(SEGUNDOS_DOBLE_COBRO)).stream()
                    .filter(p -> p.getMetodoPago() == dto.getMetodoPago() && dto.getPlanTipo().equalsIgnoreCase(p.getMembresia().getTipoMembresia()))
                    .findFirst();
            if (dobleClic.isPresent()) return mapearAResponseDTO(dobleClic.get());
        }
        Membresia membresia = membresiaService.renovar(dto.getSocioId(), dto.getPlanTipo());

        // Registra el pago asociado
        Pago pago = new Pago();
        pago.setMembresia(membresia);
        pago.setMonto(membresia.getPrecio());
        pago.setMetodoPago(dto.getMetodoPago());
        pago.setEstadoPago(EstadoPago.COMPLETADO);
        pago.setObservaciones(dto.getObservaciones());
        pago.setClaveIdempotencia(k);
        pago.setTipoPlan(membresia.getTipoMembresia());

        com.example.gymtrack_backend.auditoria.AuditoriaInterceptor.socio(dto.getSocioId());
        com.example.gymtrack_backend.auditoria.AuditoriaInterceptor.detalle(
                membresia.getTipoMembresia() + " · $" + membresia.getPrecio() + " · " + dto.getMetodoPago()
                + " · vence " + membresia.getFechaVencimiento());
        return mapearAResponseDTO(pagoRepository.save(pago));
    }

    // ──────────────────────────────────────────────
    // LISTAR
    // ──────────────────────────────────────────────

    /** Pagos de un período (por defecto, los últimos 12 meses), del más nuevo al más viejo */
    @Transactional(readOnly = true)
    public List<PagoResponseDTO> listar(java.time.LocalDate desde, java.time.LocalDate hasta) {
        java.time.LocalDate h = hasta != null ? hasta : java.time.LocalDate.now();
        java.time.LocalDate d = desde != null ? desde : h.minusMonths(12);
        if (d.isAfter(h)) throw new IllegalArgumentException("La fecha desde no puede ser posterior a hasta");
        return pagoRepository.entreConSocio(d.atStartOfDay(), h.plusDays(1).atStartOfDay())
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
