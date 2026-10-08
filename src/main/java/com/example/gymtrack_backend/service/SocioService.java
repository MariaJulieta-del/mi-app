package com.example.gymtrack_backend.service;

import com.example.gymtrack_backend.dto.AltaSocioRequestDTO;
import com.example.gymtrack_backend.dto.AltaSocioResponseDTO;
import com.example.gymtrack_backend.entities.Membresia;
import com.example.gymtrack_backend.entities.Pago;
import com.example.gymtrack_backend.entities.Socio;
import com.example.gymtrack_backend.entities.Usuario;
import com.example.gymtrack_backend.entities.enums.EstadoMembresia;
import com.example.gymtrack_backend.entities.enums.EstadoPago;
import com.example.gymtrack_backend.entities.enums.MetodoPago;
import com.example.gymtrack_backend.entities.enums.Rol;
import com.example.gymtrack_backend.repository.PagoRepository;
import com.example.gymtrack_backend.repository.SocioRepository;
import com.example.gymtrack_backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
public class SocioService {

    @Autowired
    private PinService pinService;

    @Autowired
    private SocioRepository socioRepository;

    @Autowired
    private MembresiaService membresiaService;

    @Autowired
    private PagoRepository pagoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private com.example.gymtrack_backend.repository.BajaSocioRepository bajaSocioRepository;

    // Obtener solo socios activos (comportamiento por defecto)
    public List<Socio> obtenerTodos() {
        return socioRepository.findByActivoTrue();
    }

    // Obtener TODOS los socios, activos e inactivos (para vista completa)
    public List<Socio> obtenerTodosConInactivos() {
        return socioRepository.findAll();
    }

    // Buscar socio por ID
    public Optional<Socio> obtenerPorId(Long id) {
        return socioRepository.findById(id);
    }

    public static final java.util.Set<String> GENEROS = java.util.Set.of("FEMENINO", "MASCULINO", "NO_BINARIO");

    /** Vacío = sin dato; cualquier otro valor tiene que ser uno de los tres */
    static String normalizarGenero(String genero) {
        if (genero == null || genero.isBlank()) return null;
        String g = genero.trim().toUpperCase().replace(' ', '_').replace('-', '_');
        if (!GENEROS.contains(g)) throw new IllegalArgumentException("Género inválido: " + genero);
        return g;
    }

    /** La fecha de nacimiento no puede ser futura ni dar una edad imposible */
    static void validarNacimiento(java.time.LocalDate nacimiento) {
        if (nacimiento == null) return;
        java.time.LocalDate hoy = java.time.LocalDate.now();
        if (nacimiento.isAfter(hoy)) throw new IllegalArgumentException("La fecha de nacimiento no puede ser futura");
        if (nacimiento.isBefore(hoy.minusYears(110))) throw new IllegalArgumentException("Revisá la fecha de nacimiento");
    }

    // Crear nuevo socio
    public Socio crear(Socio socio) {
        if (socioRepository.existsByDni(socio.getDni())) {
            throw new RuntimeException("Ya existe un socio con ese DNI");
        }
        socio.setGenero(normalizarGenero(socio.getGenero()));
        validarNacimiento(socio.getFechaNacimiento());
        socio.setActivo(true);
        return socioRepository.save(socio);
    }

    // Actualizar socio
    public Socio actualizar(Long id, Socio socioActualizado) {
        Socio socio = socioRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Socio no encontrado"));
        socio.setNombre(socioActualizado.getNombre());
        socio.setApellido(socioActualizado.getApellido());
        socio.setTelefono(socioActualizado.getTelefono());
        socio.setEmail(socioActualizado.getEmail());
        validarNacimiento(socioActualizado.getFechaNacimiento());
        socio.setFechaNacimiento(socioActualizado.getFechaNacimiento());
        socio.setGenero(normalizarGenero(socioActualizado.getGenero()));
        socio.setFechaVencimiento(socioActualizado.getFechaVencimiento());
        socio.setEstado(socioActualizado.getEstado());
        return socioRepository.save(socio);
    }

    // Baja lógica (no borra, marca como inactivo) y registra el motivo
    @Transactional
    public void darDeBaja(Long id, String motivo, String detalle, String usuario) {
        String m = motivo == null || motivo.isBlank() ? "SIN_ESPECIFICAR" : motivo.trim().toUpperCase();
        if (!com.example.gymtrack_backend.entities.BajaSocio.MOTIVOS.contains(m)) {
            throw new IllegalArgumentException("Motivo de baja inválido: " + motivo);
        }
        Socio socio = socioRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Socio no encontrado"));
        if (!Boolean.TRUE.equals(socio.getActivo())) {
            throw new IllegalStateException("El socio ya está dado de baja");
        }
        socio.setActivo(false);
        socio.setEstado("INACTIVO");
        socioRepository.save(socio);

        var baja = new com.example.gymtrack_backend.entities.BajaSocio();
        baja.setSocio(socio);
        baja.setSocioNombre(socio.getNombre() + " " + socio.getApellido());
        baja.setFecha(java.time.LocalDateTime.now());
        baja.setMotivo(m);
        baja.setDetalle(detalle == null || detalle.isBlank() ? null : detalle.trim());
        baja.setRegistradoPor(usuario);
        bajaSocioRepository.save(baja);
    }

    // Historial de bajas (la más nueva primero)
    @Transactional(readOnly = true)
    public List<com.example.gymtrack_backend.dto.BajaSocioDTO> listarBajas() {
        return bajaSocioRepository.findAllConSocio().stream()
            .map(b -> new com.example.gymtrack_backend.dto.BajaSocioDTO(
                b.getId(),
                b.getSocio() != null ? b.getSocio().getId() : null,
                b.getSocioNombre(),
                b.getSocio() != null && Boolean.TRUE.equals(b.getSocio().getActivo()),
                b.getFecha(), b.getMotivo(), b.getDetalle(), b.getRegistradoPor()))
            .toList();
    }

    // Eliminación física (solo para socios inactivos)
    public void eliminarPermanente(Long id) {
        Socio socio = socioRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Socio no encontrado"));
        if (Boolean.TRUE.equals(socio.getActivo())) {
            throw new RuntimeException("Solo se puede eliminar permanentemente un socio inactivo");
        }
        socioRepository.deleteById(id);
    }

    // Reactivar un socio previamente dado de baja
    public Socio reactivar(Long id) {
        Socio socio = socioRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Socio no encontrado"));
        socio.setActivo(true);
        socio.setEstado("ACTIVO");
        return socioRepository.save(socio);
    }

    // ──────────────────────────────────────────────
    // ALTA COMPLETA: socio + membresía (+ pago si corresponde)
    // ──────────────────────────────────────────────

    /**
     * Crea un socio y su membresía en una sola transacción.
     * - formaDePago = "PENDIENTE"             → membresía PENDIENTE_PAGO (sin pago)
     * - formaDePago = EFECTIVO|TARJETA|TRANS  → membresía ACTIVA + pago COMPLETADO
     */
    @Transactional
    public AltaSocioResponseDTO altaCompleta(AltaSocioRequestDTO req) {
        // Validaciones básicas
        if (req.getNombre()  == null || req.getNombre().isBlank())  throw new IllegalArgumentException("El nombre es obligatorio");
        if (req.getApellido()== null || req.getApellido().isBlank()) throw new IllegalArgumentException("El apellido es obligatorio");
        if (req.getDni()     == null || req.getDni().isBlank())      throw new IllegalArgumentException("El DNI es obligatorio");
        if (req.getTipoMembresia() == null || req.getTipoMembresia().isBlank()) throw new IllegalArgumentException("El plan de membresía es obligatorio");
        if (req.getFormaDePago()   == null || req.getFormaDePago().isBlank())   throw new IllegalArgumentException("La forma de pago es obligatoria");

        if (socioRepository.existsByDni(req.getDni())) {
            throw new IllegalArgumentException("Ya existe un socio con ese DNI");
        }

        // 1. Crear el socio
        Socio socio = new Socio();
        socio.setNombre(req.getNombre().trim());
        socio.setApellido(req.getApellido().trim());
        socio.setDni(req.getDni().trim());
        socio.setTelefono(req.getTelefono());
        socio.setEmail(req.getEmail());
        validarNacimiento(req.getFechaNacimiento());
        socio.setFechaNacimiento(req.getFechaNacimiento());
        socio.setGenero(normalizarGenero(req.getGenero()));
        socio.setActivo(true);
        socio.setEstado("ACTIVO");
        Socio socioGuardado = socioRepository.save(socio);

        AltaSocioResponseDTO resp = new AltaSocioResponseDTO();
        resp.setSocioId(socioGuardado.getId());
        resp.setNombre(socioGuardado.getNombre());
        resp.setApellido(socioGuardado.getApellido());
        resp.setDni(socioGuardado.getDni());
        // Usuario del socio con su PIN: se muestra una sola vez para entregárselo
        resp.setPin(pinService.asignarNuevoPin(socioGuardado.getId()));

        // 2. Cobrar el plan: crea la membresía ACTIVA + pago (no existe el alta sin pago)
        MetodoPago metodo;
        try {
            metodo = MetodoPago.valueOf(req.getFormaDePago().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Forma de pago inválida: " + req.getFormaDePago() + ". Valores válidos: EFECTIVO, TARJETA, TRANSFERENCIA");
        }

        Membresia mem = membresiaService.renovar(socioGuardado.getId(), req.getTipoMembresia());

        Pago pago = new Pago();
        pago.setMembresia(mem);
        pago.setMonto(mem.getPrecio());
        pago.setMetodoPago(metodo);
        pago.setEstadoPago(EstadoPago.COMPLETADO);
        Pago pagoGuardado = pagoRepository.save(pago);

        resp.setMembresiaId(mem.getId());
        resp.setTipoMembresia(mem.getTipoMembresia());
        resp.setEstadoMembresia(EstadoMembresia.ACTIVA.name());
        resp.setFechaInicio(mem.getFechaInicio());
        resp.setFechaVencimiento(mem.getFechaVencimiento());
        resp.setPrecio(mem.getPrecio());
        resp.setPasesMensuales(mem.getPasesMensuales());
        resp.setPagoId(pagoGuardado.getId());
        resp.setMetodoPago(metodo.name());
        resp.setMontoPagado(mem.getPrecio());

        return resp;
    }
}