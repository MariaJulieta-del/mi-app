package com.example.gymtrack_backend.service;

import com.example.gymtrack_backend.dto.AsistenciaCheckinDTO;
import com.example.gymtrack_backend.dto.AsistenciaResponseDTO;
import com.example.gymtrack_backend.entities.Asistencia;
import com.example.gymtrack_backend.entities.Membresia;
import com.example.gymtrack_backend.entities.Socio;
import com.example.gymtrack_backend.repository.AsistenciaRepository;
import com.example.gymtrack_backend.repository.MembresiaRepository;
import com.example.gymtrack_backend.repository.SocioRepository;
import com.example.gymtrack_backend.repository.UsuarioRepository;
import com.example.gymtrack_backend.entities.Usuario;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AsistenciaService {

    private final AsistenciaRepository asistenciaRepo;
    private final SocioRepository      socioRepo;
    private final MembresiaRepository  membresiaRepo;
    private final MembresiaService     membresiaService;
    private final UsuarioRepository    usuarioRepo;
    private final QrIngresoService     qrIngresoService;

    /**
     * Registra el ingreso (o salida) de un socio.
     *
     * Reglas de acceso (ENTRADA):
     *  1. Socio dado de baja o sin membresía vigente → ROJO (denegado).
     *  2. Ya ingresó hoy → permitido sin consumir otro pase.
     *  3. Plan con los pases del mes agotados → ROJO.
     *  4. Si no → permitido; AMARILLO cuando quedan ≤ 2 pases o vence en ≤ 5 días.
     */
    /**
     * Ingreso hecho por el propio socio escaneando el QR de recepción.
     * El socio se toma del usuario autenticado (nunca de lo que manda el cliente),
     * así que solo puede registrar su propio ingreso y solo estando en el gimnasio.
     */
    @Transactional
    public AsistenciaResponseDTO registrarPorQr(String username, String codigo) {
        if (!qrIngresoService.esValido(codigo)) {
            throw new IllegalArgumentException("El código QR no es válido o ya venció. Escaneá el que está en la pantalla de recepción.");
        }
        Usuario usuario = usuarioRepo.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        if (usuario.getSocio() == null) {
            throw new IllegalArgumentException("Solo los socios pueden registrar su ingreso con el QR");
        }
        AsistenciaCheckinDTO dto = new AsistenciaCheckinDTO();
        dto.setSocioId(usuario.getSocio().getId());
        dto.setTipo("ENTRADA");
        return registrarCheckin(dto);
    }

    public AsistenciaResponseDTO registrarCheckin(AsistenciaCheckinDTO dto) {

        // 1. Buscar el socio
        Socio socio;
        if (dto.getDni() != null && !dto.getDni().isBlank()) {
            socio = socioRepo.findByDni(dto.getDni().trim())
                    .orElseThrow(() -> new RuntimeException("No existe un socio con DNI: " + dto.getDni()));
        } else if (dto.getSocioId() != null) {
            socio = socioRepo.findById(dto.getSocioId())
                    .orElseThrow(() -> new RuntimeException("Socio no encontrado: " + dto.getSocioId()));
        } else {
            throw new IllegalArgumentException("Debe ingresar el DNI o el ID del socio");
        }

        String tipo = (dto.getTipo() != null) ? dto.getTipo().toUpperCase() : "ENTRADA";
        LocalDate hoy = LocalDate.now();
        Membresia membresia = membresiaRepo.findBySocioId(socio.getId()).orElse(null);

        boolean tieneAcceso;
        String  observacion  = null;
        String  estadoAcceso;
        MembresiaService.PasesInfo pases = null;

        if (!Boolean.TRUE.equals(socio.getActivo())) {
            tieneAcceso  = false;
            estadoAcceso = "ROJO";
            observacion  = "Acceso denegado: el socio está dado de baja";
        } else if (membresia == null) {
            tieneAcceso  = false;
            estadoAcceso = "ROJO";
            observacion  = "Acceso denegado: el socio no tiene membresía. Cobrale un plan.";
        } else if (!membresiaService.estaVigente(membresia, hoy)) {
            tieneAcceso  = false;
            estadoAcceso = "ROJO";
            observacion  = "Acceso denegado: membresía " + membresia.getEstadoMembresia().name().toLowerCase()
                         + ". Debe renovar para ingresar.";
        } else {
            pases = membresiaService.calcularPases(membresia, hoy);
            boolean yaIngresoHoy = "ENTRADA".equals(tipo)
                    && asistenciaRepo.existsBySocioIdAndFechaAndTipoAndPermitidoTrue(socio.getId(), hoy, "ENTRADA");

            if ("ENTRADA".equals(tipo) && !yaIngresoHoy && !pases.libre() && pases.restantes() <= 0) {
                tieneAcceso  = false;
                estadoAcceso = "ROJO";
                observacion  = "Acceso denegado: usó los " + pases.pasesMensuales()
                             + " pases del mes. Se renuevan el " + pases.cicloFin().plusDays(1) + ".";
            } else {
                tieneAcceso  = true;
                estadoAcceso = "VERDE";
                // Pases que quedarán después de este ingreso
                Integer quedan = pases.libre() ? null
                        : (yaIngresoHoy ? pases.restantes() : pases.restantes() - 1);
                long diasParaVencer = ChronoUnit.DAYS.between(hoy, membresia.getFechaVencimiento());

                if (yaIngresoHoy) {
                    observacion = "Ya había ingresado hoy (no consume otro pase).";
                } else if (quedan != null && quedan <= 2) {
                    estadoAcceso = "AMARILLO";
                    observacion  = quedan == 0 ? "Último pase del mes." : "Le quedan " + quedan + " pases este mes.";
                }
                if (diasParaVencer <= 5) {
                    estadoAcceso = "AMARILLO";
                    String aviso = diasParaVencer == 0 ? "La membresía vence hoy." : "La membresía vence en " + diasParaVencer + " días.";
                    observacion = observacion == null ? aviso : observacion + " " + aviso;
                }
            }
        }

        // 2. Persistir la asistencia
        Asistencia asistencia = new Asistencia();
        asistencia.setSocio(socio);
        asistencia.setFecha(hoy);
        asistencia.setHora(LocalTime.now());
        asistencia.setTipo(tipo);
        asistencia.setPermitido(tieneAcceso);
        asistencia.setObservacion(observacion);
        asistenciaRepo.save(asistencia);

        // 3. Recalcular los pases ya con este ingreso registrado
        if (tieneAcceso && membresia != null) {
            pases = membresiaService.calcularPases(membresia, hoy);
        }
        return mapear(asistencia, membresia, pases, estadoAcceso);
    }

    public List<AsistenciaResponseDTO> listarHoy() {
        return asistenciaRepo.findByFechaOrderByHoraDesc(LocalDate.now())
                .stream().map(a -> mapear(a, null, null, null)).toList();
    }

    public List<AsistenciaResponseDTO> listarPorSocio(Long socioId) {
        return asistenciaRepo.findBySocioIdOrderByFechaDescHoraDesc(socioId)
                .stream().map(a -> mapear(a, null, null, null)).toList();
    }

    public List<AsistenciaResponseDTO> listarPorRango(LocalDate desde, LocalDate hasta) {
        return asistenciaRepo.findByFechaBetweenOrderByFechaDescHoraDesc(desde, hasta)
                .stream().map(a -> mapear(a, null, null, null)).toList();
    }

    public Long countHoy() {
        return asistenciaRepo.countSociosHoy(LocalDate.now());
    }

    private AsistenciaResponseDTO mapear(Asistencia a, Membresia m, MembresiaService.PasesInfo pases, String estadoAcceso) {
        return new AsistenciaResponseDTO(
                a.getId(),
                a.getSocio().getId(),
                a.getSocio().getNombre() + " " + a.getSocio().getApellido(),
                a.getSocio().getDni(),
                a.getFecha(),
                a.getHora(),
                a.getTipo(),
                a.getPermitido(),
                a.getObservacion(),
                m != null ? m.getFechaVencimiento() : null,
                m != null ? m.getTipoMembresia() : null,
                pases != null ? pases.libre() : null,
                pases != null ? pases.pasesMensuales() : null,
                pases != null ? pases.usados() : null,
                pases != null ? pases.restantes() : null,
                estadoAcceso
        );
    }
}
