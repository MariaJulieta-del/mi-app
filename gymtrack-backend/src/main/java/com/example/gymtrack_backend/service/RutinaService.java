package com.example.gymtrack_backend.service;

import com.example.gymtrack_backend.dto.EjercicioRequestDTO;
import com.example.gymtrack_backend.dto.EjercicioResponseDTO;
import com.example.gymtrack_backend.dto.EjercicioUpdateDTO;
import com.example.gymtrack_backend.dto.RutinaRequestDTO;
import com.example.gymtrack_backend.dto.RutinaResponseDTO;
import com.example.gymtrack_backend.dto.AsignacionDTO;
import com.example.gymtrack_backend.entities.Ejercicio;
import com.example.gymtrack_backend.entities.Rutina;
import com.example.gymtrack_backend.entities.RutinaEjercicio;
import com.example.gymtrack_backend.entities.RutinaAsignacion;
import com.example.gymtrack_backend.entities.Socio;
import com.example.gymtrack_backend.repository.EjercicioRepository;
import com.example.gymtrack_backend.repository.ProgresoEjercicioRepository;
import com.example.gymtrack_backend.repository.RutinaEjercicioRepository;
import com.example.gymtrack_backend.repository.RutinaRepository;
import com.example.gymtrack_backend.repository.SocioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Servicio con la lógica de negocio de las rutinas y sus ejercicios.
 * Valida propietario en cada operación de escritura.
 */
@Service
public class RutinaService {

    @Autowired
    private RutinaRepository rutinaRepository;

    @Autowired
    private SocioRepository socioRepository;

    @Autowired
    private RutinaEjercicioRepository rutinaEjercicioRepository;

    @Autowired
    private EjercicioRepository ejercicioRepository;

    @Autowired
    private ProgresoEjercicioRepository progresoEjercicioRepository;

    @Autowired
    private com.example.gymtrack_backend.repository.MaquinaRepository maquinaRepository;

    @Autowired
    private ReglasRutina reglas;

    @Autowired
    private com.example.gymtrack_backend.security.AccesoSocio acceso;

    @Autowired
    @org.springframework.context.annotation.Lazy
    private SolicitudRutinaService solicitudes;

    @Autowired
    private com.example.gymtrack_backend.repository.RutinaAsignacionRepository asignacionRepo;

    @Autowired
    private RutinasDelSocio rutinasDelSocio;

    /** Cuántas plantillas puede elegirse un socio por semana (para que no llene su cuenta de rutinas) */
    public static final int ELEGIDAS_POR_SEMANA = 3;

    // ──────────────────────────────────────────────
    // RUTINAS - CRUD
    // ──────────────────────────────────────────────

    // SIN @Transactional en el método padre: cada repository.save() tiene su propia
    // transacción implícita. Así un fallo en crearCalentamientoDefault no hace rollback
    // de la rutina que ya se commiteó.
    public RutinaResponseDTO crearRutina(Long socioId, RutinaRequestDTO dto) {
        Rutina rutina = new Rutina();
        rutina.setNombre(dto.getNombre());
        rutina.setDescripcion(dto.getDescripcion());
        rutina.setDificultad(dto.getDificultad());
        rutina.setObjetivo(normalizarObjetivo(dto.getObjetivo()));
        rutina.setNotasProfe(dto.getNotasProfe() == null || dto.getNotasProfe().isBlank() ? null : dto.getNotasProfe().trim());
        if (dto.getTrenes() != null) {
            rutina.getTrenes().clear();
            rutina.getTrenes().addAll(dto.getTrenes());
        }
        if (dto.getDiasSemana() != null) {
            rutina.getDiasSemana().clear();
            rutina.getDiasSemana().addAll(dto.getDiasSemana());
        }

        if (socioId != null) {
            Socio socio = socioRepository.findById(socioId)
                .orElseThrow(() -> new com.example.gymtrack_backend.web.RecursoNoEncontradoException("Socio no encontrado con id: " + socioId));
            rutina.setSocio(socio);
        }
        // socioId == null → rutina general sin socio asignado

        // 1. Guardar la rutina en su propia transacción (commit inmediato)
        Rutina guardada = rutinaRepository.save(rutina);
        if (guardada.getSocio() != null && acceso.esStaff()) solicitudes.resolverConRutina(guardada);

        // 2. Agregar calentamiento. Si falla (p.ej. columna es_calentamiento aún no existe
        //    porque el backend no fue reiniciado desde la migración V19), la rutina ya quedó
        //    guardada y se responde exitosamente. Los ejercicios de calentamiento aparecerán
        //    automáticamente al reiniciar el backend (V19 corre y la columna existe).
        try {
            crearCalentamientoDefault(guardada);
        } catch (Exception e) {
            System.err.println("[RutinaService] Calentamiento default omitido (¿migración V19 pendiente?): " + e.getMessage());
        }

        return mapearAResponseDTO(guardada);
    }

    /** Devuelve las plantillas (sin socio), con cuántos socios la tienen asignada. Solo staff. */
    @Transactional(readOnly = true)
    public List<RutinaResponseDTO> listarGenerales() {
        int max = reglas.semanasMax();
        java.time.LocalDate hoy = java.time.LocalDate.now();
        java.util.Map<Long, List<RutinaAsignacion>> porPlantilla = asignacionRepo.deSociosActivos()
            .stream().collect(Collectors.groupingBy(a -> a.getRutina().getId()));
        List<Rutina> plantillas = rutinaRepository.findBySocioIsNull();
        java.util.Map<Long, Conteo> cs = conteos(plantillas.stream().map(Rutina::getId).toList());
        return plantillas
            .stream()
            .map(r -> {
                RutinaResponseDTO d = mapearAResponseDTO(r, cs.get(r.getId()));
                List<RutinaAsignacion> as = porPlantilla.getOrDefault(r.getId(), List.of());
                d.setCantidadAsignados(as.size());
                d.setAsignadosParaRenovar(as.stream().filter(a -> ReglasRutina.semanas(RutinasDelSocio.inicio(a), hoy) >= max).count());
                return d;
            })
            .collect(Collectors.toList());
    }

    /** Rutinas de un socio: las personalizadas y las plantillas que tiene asignadas */
    @Transactional(readOnly = true)
    public List<RutinaResponseDTO> obtenerRutinas(Long socioId) {
        List<RutinasDelSocio.RutinaDeSocio> lista = rutinasDelSocio.de(socioId);
        java.util.Map<Long, Conteo> cs = conteos(lista.stream().map(x -> x.rutina().getId()).toList());
        return lista.stream()
            .map(x -> x.asignada() ? mapearAsignacion(x.asignacion(), cs.get(x.rutina().getId())) : mapearAResponseDTO(x.rutina(), cs.get(x.rutina().getId())))
            .collect(Collectors.toList());
    }

    /** Devuelve TODAS las rutinas del sistema (para rol ADMIN). */
    public List<RutinaResponseDTO> listarTodas() {
        List<Rutina> todas = rutinaRepository.findAll();
        java.util.Map<Long, Conteo> cs = conteos(todas.stream().map(Rutina::getId).toList());
        return todas
            .stream()
            .map(r -> mapearAResponseDTO(r, cs.get(r.getId())))
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RutinaResponseDTO obtenerRutina(Long rutinaId, Long socioId) {
        Rutina rutina = findRutina(rutinaId, socioId);
        // Una plantilla vista "como rutina del socio": con sus semanas desde que se la asignaron
        if (socioId != null && rutina.getSocio() == null) {
            var asignacion = asignacionRepo.findByRutinaIdAndSocioId(rutinaId, socioId);
            if (asignacion.isPresent()) return mapearAsignacion(asignacion.get());
        }
        RutinaResponseDTO dto = mapearAResponseDTO(rutina);
        // En el editor de una plantilla se avisa a cuántos socios les llegan los cambios
        if (rutina.getSocio() == null && acceso.esStaff()) dto.setCantidadAsignados(asignacionRepo.dePlantilla(rutinaId).size());
        return dto;
    }

    @Transactional
    public RutinaResponseDTO actualizarRutina(Long rutinaId, Long socioId, RutinaRequestDTO dto) {
        Rutina rutina = findRutina(rutinaId, socioId);

        rutina.setNombre(dto.getNombre());
        rutina.setDescripcion(dto.getDescripcion());
        rutina.setDificultad(dto.getDificultad());
        rutina.setObjetivo(normalizarObjetivo(dto.getObjetivo()));
        rutina.setNotasProfe(dto.getNotasProfe() == null || dto.getNotasProfe().isBlank() ? null : dto.getNotasProfe().trim());
        if (dto.getTrenes() != null) {
            rutina.getTrenes().clear();
            rutina.getTrenes().addAll(dto.getTrenes());
        }
        if (dto.getDiasSemana() != null) {
            rutina.getDiasSemana().clear();
            rutina.getDiasSemana().addAll(dto.getDiasSemana());
        }

        return mapearAResponseDTO(rutinaRepository.save(rutina));
    }

    @Transactional
    public void eliminarRutina(Long rutinaId, Long socioId) {
        Rutina rutina = findRutina(rutinaId, socioId);
        if (rutina.getSocio() == null) {
            long usan = asignacionRepo.dePlantilla(rutinaId).size();
            if (usan > 0) {
                throw new IllegalStateException("La tienen asignada " + usan + (usan == 1 ? " socio" : " socios")
                    + ". Quitásela o asignales otra antes de eliminarla.");
            }
        }
        // 1. Borrar progreso de todos los ejercicios de esta rutina
        progresoEjercicioRepository.deleteByRutinaId(rutinaId);
        // 2. Borrar todos los ejercicios de la rutina
        rutinaEjercicioRepository.deleteByRutinaId(rutinaId);
        // 3. Borrar la rutina (las element collections rutina_trenes y rutina_dias
        //    se eliminan en cascada por JPA al borrar el padre)
        rutinaRepository.delete(rutina);
    }

    // ──────────────────────────────────────────────
    // EJERCICIOS
    // ──────────────────────────────────────────────

    /**
     * Devuelve los ejercicios de una rutina, validando que el socio sea el propietario.
     * @Transactional(readOnly = true) es necesario para que las relaciones LAZY
     * (rutina.socio, rutinaEjercicio.ejercicioCatalogo) se carguen dentro de la misma
     * sesión JPA sin LazyInitializationException.
     */
    @Transactional(readOnly = true)
    public List<EjercicioResponseDTO> obtenerEjercicios(Long rutinaId, Long socioId) {
        findRutina(rutinaId, socioId);
        // Las máquinas del gimnasio son pocas: se cargan una vez para toda la rutina
        java.util.Map<Long, com.example.gymtrack_backend.entities.Maquina> maquinas = maquinaRepository.findAll().stream()
            .collect(Collectors.toMap(com.example.gymtrack_backend.entities.Maquina::getId, m -> m));
        return rutinaEjercicioRepository.findByRutinaIdOrderByOrden(rutinaId)
            .stream()
            .map(ej -> mapearEjercicioADTO(ej, maquinas))
            .collect(Collectors.toList());
    }

    /**
     * Agrega un ejercicio a la rutina. El orden se auto-asigna si no se provee.
     */
    @Transactional
    public EjercicioResponseDTO agregarEjercicio(Long rutinaId, Long socioId, EjercicioRequestDTO dto) {
        Rutina rutina = findRutina(rutinaId, socioId);

        RutinaEjercicio ej = new RutinaEjercicio();
        ej.setRutina(rutina);
        ej.setNombreEjercicio(dto.getNombreEjercicio());
        ej.setSeries(dto.getSeries());
        ej.setRepeticiones(dto.getRepeticiones());
        ej.setPesoKg(dto.getPesoKg());
        ej.setDescansoSeg(dto.getDescansoSeg());
        ej.setNotas(dto.getNotas());

        // Vincular al catálogo si se provee un ID
        if (dto.getEjercicioCatalogoId() != null) {
            ejercicioRepository.findById(dto.getEjercicioCatalogoId())
                    .ifPresent(ej::setEjercicioCatalogo);
        }

        // Auto-asignar orden si no se provee
        int orden = (dto.getOrden() != null)
            ? dto.getOrden()
            : rutinaEjercicioRepository.countByRutinaId(rutinaId) + 1;
        ej.setOrden(orden);
        if (dto.getEsCalentamiento() != null) {
            ej.setEsCalentamiento(dto.getEsCalentamiento());
        }
        ej.setDia(dto.getDia() != null ? dto.getDia() : 1);

        // Sumar un ejercicio también cuenta como renovar la rutina
        rutina.setFechaRenovacion(java.time.LocalDateTime.now());
        rutinaRepository.save(rutina);
        return mapearEjercicioADTO(rutinaEjercicioRepository.save(ej));
    }

    /**
     * Actualiza series/reps/peso/descanso/notas de un ejercicio en la rutina.
     */
    @Transactional
    public EjercicioResponseDTO actualizarEjercicio(Long ejercicioId, Long rutinaId, Long socioId, EjercicioUpdateDTO dto) {
        findRutina(rutinaId, socioId);
        RutinaEjercicio ej = rutinaEjercicioRepository.findById(ejercicioId)
            .filter(x -> x.getRutina() != null && x.getRutina().getId().equals(rutinaId))
            .orElseThrow(() -> new com.example.gymtrack_backend.web.RecursoNoEncontradoException("Ejercicio no encontrado en esta rutina"));
        if (dto.getSeries() != null)       ej.setSeries(dto.getSeries());
        if (dto.getRepeticiones() != null) ej.setRepeticiones(dto.getRepeticiones());
        if (dto.getPesoKg() != null)       ej.setPesoKg(dto.getPesoKg());
        if (dto.getDescansoSeg() != null)  ej.setDescansoSeg(dto.getDescansoSeg());
        if (dto.getNotas() != null)        ej.setNotas(dto.getNotas());
        return mapearEjercicioADTO(rutinaEjercicioRepository.save(ej));
    }

    /**
     * Superserie: une el ejercicio con el que le sigue en el mismo día (se hacen alternando series),
     * o lo separa de su superserie.
     */
    @Transactional
    public List<EjercicioResponseDTO> cambiarSuperserie(Long ejercicioId, Long rutinaId, Long socioId, boolean unirConSiguiente) {
        findRutina(rutinaId, socioId);
        List<RutinaEjercicio> todos = rutinaEjercicioRepository.findByRutinaIdOrderByOrden(rutinaId);
        RutinaEjercicio ej = todos.stream().filter(x -> x.getId().equals(ejercicioId)).findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Ejercicio no encontrado en la rutina"));
        if (ej.isEsCalentamiento()) throw new IllegalArgumentException("La entrada en calor no va en superserie");
        int dia = ej.getDia() != null ? ej.getDia() : 1;
        List<RutinaEjercicio> delDia = todos.stream()
            .filter(x -> !x.isEsCalentamiento() && (x.getDia() != null ? x.getDia() : 1) == dia).toList();
        int pos = delDia.indexOf(ej);

        if (unirConSiguiente) {
            if (pos < 0 || pos == delDia.size() - 1) throw new IllegalArgumentException("Es el último ejercicio del día: no hay con cuál unirlo");
            RutinaEjercicio sig = delDia.get(pos + 1);
            Integer grupo = ej.getSuperserie() != null ? ej.getSuperserie()
                : sig.getSuperserie() != null ? sig.getSuperserie()
                : todos.stream().map(RutinaEjercicio::getSuperserie).filter(java.util.Objects::nonNull).max(Integer::compare).orElse(0) + 1;
            // Si el siguiente estaba en otra superserie, se unen las dos
            Integer viejo = sig.getSuperserie();
            for (RutinaEjercicio x : todos) {
                if (x == ej || x == sig || (viejo != null && viejo.equals(x.getSuperserie()))) x.setSuperserie(grupo);
            }
        } else if (ej.getSuperserie() != null) {
            Integer grupo = ej.getSuperserie();
            ej.setSuperserie(null);
            List<RutinaEjercicio> resto = todos.stream().filter(x -> grupo.equals(x.getSuperserie())).toList();
            if (resto.size() < 2) resto.forEach(x -> x.setSuperserie(null));
        }
        rutinaEjercicioRepository.saveAll(todos);
        java.util.Map<Long, com.example.gymtrack_backend.entities.Maquina> maquinas = maquinaRepository.findAll().stream()
            .collect(Collectors.toMap(com.example.gymtrack_backend.entities.Maquina::getId, m -> m));
        return todos.stream().map(x -> mapearEjercicioADTO(x, maquinas)).toList();
    }

    /**
     * Elimina un ejercicio de la rutina, validando que el socio sea el propietario.
     */
    @Transactional
    public void eliminarEjercicio(Long ejercicioId, Long rutinaId, Long socioId) {
        findRutina(rutinaId, socioId);
        RutinaEjercicio ej = rutinaEjercicioRepository.findById(ejercicioId)
            .filter(x -> x.getRutina() != null && x.getRutina().getId().equals(rutinaId))
            .orElseThrow(() -> new com.example.gymtrack_backend.web.RecursoNoEncontradoException("Ejercicio no encontrado en esta rutina"));
        if (ej.isEsCalentamiento()) {
            throw new IllegalStateException(
                "Los ejercicios de entrada en calor son inamovibles y no pueden eliminarse.");
        }
        progresoEjercicioRepository.deleteByRutinaEjercicioId(ej.getId());
        rutinaEjercicioRepository.delete(ej);
    }

    /**
     * Reemplaza los ejercicios de la rutina (sin tocar la entrada en calor) por la lista que llega,
     * en ese orden: los que traen id se actualizan, los nuevos se crean y los que faltan se borran
     * (junto con su progreso).
     */
    @Transactional
    public List<EjercicioResponseDTO> reemplazarEjercicios(Long rutinaId, Long socioId, List<EjercicioRequestDTO> lista) {
        Rutina rutina = findRutina(rutinaId, socioId);
        List<RutinaEjercicio> actuales = rutinaEjercicioRepository.findByRutinaIdOrderByOrden(rutinaId);
        java.util.Map<Long, RutinaEjercicio> porId = new java.util.HashMap<>();
        actuales.stream().filter(e -> !e.isEsCalentamiento()).forEach(e -> porId.put(e.getId(), e));
        // Los principales van después de la entrada en calor
        int orden = actuales.stream().filter(RutinaEjercicio::isEsCalentamiento).mapToInt(e -> e.getOrden() != null ? e.getOrden() : 0).max().orElse(0);

        // Validar antes de tocar nada
        java.util.Set<Long> quedan = new java.util.HashSet<>();
        for (EjercicioRequestDTO d : lista) {
            if (d.getNombreEjercicio() == null || d.getNombreEjercicio().isBlank()) {
                throw new IllegalArgumentException("Hay un ejercicio sin nombre");
            }
            if (d.getId() != null) {
                if (!porId.containsKey(d.getId())) throw new IllegalArgumentException("El ejercicio " + d.getId() + " no es de esta rutina");
                quedan.add(d.getId());
            }
        }
        // 1. Sacar los que ya no están (con su progreso)
        for (RutinaEjercicio e : porId.values()) {
            if (quedan.contains(e.getId())) continue;
            progresoEjercicioRepository.deleteByRutinaEjercicioId(e.getId());
            rutinaEjercicioRepository.delete(e);
        }
        rutinaEjercicioRepository.flush();
        // 2. Correr los que quedan a posiciones provisorias (el orden es único dentro de la rutina)
        int provisorio = -1;
        for (Long id : quedan) {
            RutinaEjercicio e = porId.get(id);
            e.setOrden(provisorio--);
            rutinaEjercicioRepository.save(e);
        }
        rutinaEjercicioRepository.flush();
        // 3. Guardar en el orden final
        for (EjercicioRequestDTO d : lista) {
            RutinaEjercicio ej = d.getId() != null ? porId.get(d.getId()) : null;
            if (ej == null) {
                ej = new RutinaEjercicio();
                ej.setRutina(rutina);
                ej.setNombreEjercicio(d.getNombreEjercicio().trim());
                if (d.getEjercicioCatalogoId() != null) ejercicioRepository.findById(d.getEjercicioCatalogoId()).ifPresent(ej::setEjercicioCatalogo);
            }
            ej.setSeries(d.getSeries());
            ej.setRepeticiones(d.getRepeticiones());
            ej.setDescansoSeg(d.getDescansoSeg());
            if (d.getPesoKg() != null) ej.setPesoKg(d.getPesoKg());
            ej.setNotas(d.getNotas() == null || d.getNotas().isBlank() ? null : d.getNotas().trim());
            int dia = d.getDia() != null && d.getDia() > 0 ? d.getDia() : 1;
            if (ej.getDia() != null && ej.getDia() != dia) ej.setSuperserie(null);   // cambió de día: sale de la superserie
            ej.setDia(dia);
            ej.setOrden(++orden);
            rutinaEjercicioRepository.save(ej);
        }
        rutinaEjercicioRepository.flush();
        // Se cambiaron los ejercicios: desde hoy se cuenta de nuevo cuánto hace que la hace
        rutina.setFechaRenovacion(java.time.LocalDateTime.now());
        rutinaRepository.save(rutina);
        java.util.Map<Long, com.example.gymtrack_backend.entities.Maquina> maquinas = maquinaRepository.findAll().stream()
            .collect(Collectors.toMap(com.example.gymtrack_backend.entities.Maquina::getId, m -> m));
        return rutinaEjercicioRepository.findByRutinaIdOrderByOrden(rutinaId).stream().map(e -> mapearEjercicioADTO(e, maquinas)).toList();
    }

    // ──────────────────────────────────────────────
    // CLONACIÓN
    // ──────────────────────────────────────────────

    /**
     * Clona una rutina (y todos sus ejercicios) asignándola opcionalmente a un socio destino.
     * Si socioDestinoId es null, la copia queda como rutina general (sin socio).
     */
    @Transactional
    public RutinaResponseDTO clonarRutina(Long rutinaOrigenId, Long socioDestinoId, String nombreNuevo) {
        Rutina origen = rutinaRepository.findById(rutinaOrigenId)
            .orElseThrow(() -> new com.example.gymtrack_backend.web.RecursoNoEncontradoException("Rutina no encontrada con id: " + rutinaOrigenId));

        Rutina nueva = new Rutina();
        nueva.setNombre((nombreNuevo != null && !nombreNuevo.isBlank())
            ? nombreNuevo : "Copia de " + origen.getNombre());
        nueva.setDescripcion(origen.getDescripcion());
        nueva.setDificultad(origen.getDificultad());
        nueva.setObjetivo(origen.getObjetivo());
        if (origen.getTrenes() != null)    nueva.getTrenes().addAll(origen.getTrenes());
        if (origen.getDiasSemana() != null) nueva.getDiasSemana().addAll(origen.getDiasSemana());

        if (socioDestinoId != null) {
            Socio socio = socioRepository.findById(socioDestinoId)
                .orElseThrow(() -> new com.example.gymtrack_backend.web.RecursoNoEncontradoException("Socio no encontrado con id: " + socioDestinoId));
            nueva.setSocio(socio);
        }

        Rutina guardada = rutinaRepository.save(nueva);
        if (guardada.getSocio() != null && acceso.esStaff()) solicitudes.resolverConRutina(guardada);

        // Clonar ejercicios conservando el orden
        List<RutinaEjercicio> ejerciciosOrigen =
            rutinaEjercicioRepository.findByRutinaIdOrderByOrden(rutinaOrigenId);
        for (RutinaEjercicio ej : ejerciciosOrigen) {
            RutinaEjercicio copia = new RutinaEjercicio();
            copia.setRutina(guardada);
            copia.setNombreEjercicio(ej.getNombreEjercicio());
            copia.setSeries(ej.getSeries());
            copia.setRepeticiones(ej.getRepeticiones());
            copia.setPesoKg(ej.getPesoKg());
            copia.setDescansoSeg(ej.getDescansoSeg());
            copia.setNotas(ej.getNotas());
            copia.setOrden(ej.getOrden());
            copia.setEjercicioCatalogo(ej.getEjercicioCatalogo());
            copia.setEsCalentamiento(ej.isEsCalentamiento());
            copia.setDia(ej.getDia());
            copia.setSuperserie(ej.getSuperserie());
            rutinaEjercicioRepository.save(copia);
        }

        return mapearAResponseDTO(guardada);
    }

    // ──────────────────────────────────────────────
    // PLANTILLAS EN LA APP DEL SOCIO
    // ──────────────────────────────────────────────

    @Transactional
    public RutinaResponseDTO cambiarVisibilidad(Long rutinaId, boolean visible) {
        Rutina r = rutinaRepository.findById(rutinaId)
            .orElseThrow(() -> new com.example.gymtrack_backend.web.RecursoNoEncontradoException("Rutina no encontrada"));
        if (r.getSocio() != null) throw new IllegalArgumentException("Solo las plantillas se muestran en la app de los socios");
        r.setVisibleSocios(visible);
        return mapearAResponseDTO(rutinaRepository.save(r));
    }

    /** Plantillas que el socio puede ver: generales, visibles y con al menos un ejercicio */
    @Transactional(readOnly = true)
    public List<RutinaResponseDTO> plantillasParaSocios() {
        List<Rutina> visibles = rutinaRepository.findBySocioIsNull().stream()
            .filter(r -> Boolean.TRUE.equals(r.getVisibleSocios())).toList();
        java.util.Map<Long, Conteo> cs = conteos(visibles.stream().map(Rutina::getId).toList());
        return visibles.stream()
            .map(r -> mapearAResponseDTO(r, cs.get(r.getId())))
            .filter(d -> d.getCantidadEjercicios() > 0)
            .map(d -> { d.setNotasProfe(null); return d; })   // las notas internas no salen
            .sorted(java.util.Comparator.comparing(RutinaResponseDTO::getNombre, String.CASE_INSENSITIVE_ORDER))
            .collect(Collectors.toList());
    }

    /** Ejercicios de una plantilla visible (para que el socio la mire antes de elegirla) */
    @Transactional(readOnly = true)
    public List<EjercicioResponseDTO> ejerciciosDePlantilla(Long plantillaId) {
        plantillaVisible(plantillaId);
        return rutinaEjercicioRepository.findByRutinaIdOrderByOrden(plantillaId).stream()
            .map(this::mapearEjercicioADTO).collect(Collectors.toList());
    }

    /**
     * El socio se copia una plantilla como su rutina. Solo plantillas visibles con ejercicios,
     * y como mucho ELEGIDAS_POR_SEMANA por semana.
     */
    @Transactional
    public RutinaResponseDTO elegirPlantilla(Long socioId, Long plantillaId) {
        plantillaVisible(plantillaId);
        if (rutinaEjercicioRepository.countByRutinaId(plantillaId) == 0) {
            throw new IllegalArgumentException("Esa plantilla todavía no tiene ejercicios");
        }
        java.time.LocalDateTime haceUnaSemana = java.time.LocalDateTime.now().minusDays(7);
        long recientes = asignacionRepo.deSocio(socioId).stream()
            .filter(a -> Boolean.TRUE.equals(a.getElegidaPorSocio()) && a.getFechaAsignacion().isAfter(haceUnaSemana))
            .count()
            // las que se copiaban antes de que existieran las asignaciones
            + rutinaRepository.findBySocioId(socioId).stream()
            .filter(r -> Boolean.TRUE.equals(r.getElegidaPorSocio()) && r.getFechaCreacion() != null && r.getFechaCreacion().isAfter(haceUnaSemana))
            .count();
        if (recientes >= ELEGIDAS_POR_SEMANA) {
            throw new IllegalStateException("Ya elegiste " + ELEGIDAS_POR_SEMANA + " plantillas esta semana. Si ninguna te sirve, pedile una personalizada a tu profe.");
        }
        boolean yaLaTiene = asignacionRepo.existsByRutinaIdAndSocioId(plantillaId, socioId)
            || rutinaRepository.findBySocioId(socioId).stream().anyMatch(r -> plantillaId.equals(r.getPlantillaOrigenId()));
        if (yaLaTiene) throw new IllegalStateException("Ya tenés esta rutina en tu lista");
        return mapearAsignacion(crearAsignacion(plantillaId, socioId, true));
    }

    // ──────────────────────────────────────────────
    // ASIGNACIÓN DE PLANTILLAS (sin copiarlas)
    // ──────────────────────────────────────────────

    /**
     * Le asigna una plantilla a un socio. No se copia: el socio la hace tal cual y la plantilla
     * sabe a quiénes está asignada. Si ya la tenía, vuelve a empezar a contar las semanas.
     */
    @Transactional
    public RutinaResponseDTO asignarPlantilla(Long plantillaId, Long socioId) {
        com.example.gymtrack_backend.auditoria.AuditoriaInterceptor.socio(socioId);
        Rutina plantilla = plantilla(plantillaId);
        if (rutinaEjercicioRepository.findByRutinaIdOrderByOrden(plantillaId).stream().allMatch(RutinaEjercicio::isEsCalentamiento)) {
            throw new IllegalArgumentException("La plantilla no tiene ejercicios todavía: agregale alguno antes de asignarla");
        }
        RutinaAsignacion a = asignacionRepo.findByRutinaIdAndSocioId(plantillaId, socioId).orElse(null);
        if (a != null) {
            a.setFechaAsignacion(java.time.LocalDateTime.now());
            a.setAsignadaPor(usuario());
            a.setElegidaPorSocio(false);
            a = asignacionRepo.save(a);
        } else {
            a = crearAsignacion(plantillaId, socioId, false);
        }
        if (acceso.esStaff()) solicitudes.resolverCon(a.getSocio(), plantilla);
        return mapearAsignacion(a);
    }

    /** Le saca la plantilla al socio (no borra la plantilla ni el progreso que registró) */
    @Transactional
    public void quitarAsignacion(Long plantillaId, Long socioId) {
        RutinaAsignacion a = asignacionRepo.findByRutinaIdAndSocioId(plantillaId, socioId)
            .orElseThrow(() -> new com.example.gymtrack_backend.web.RecursoNoEncontradoException("Ese socio no tiene asignada esta plantilla"));
        asignacionRepo.delete(a);
    }

    /**
     * Para ajustarle la plantilla a un socio: se copia como rutina personalizada suya
     * y deja de estar vinculada a la plantilla.
     */
    @Transactional
    public RutinaResponseDTO personalizar(Long plantillaId, Long socioId, String nombre) {
        Rutina plantilla = plantilla(plantillaId);
        RutinaResponseDTO copia = clonarRutina(plantillaId, socioId,
            nombre != null && !nombre.isBlank() ? nombre.trim() : plantilla.getNombre());
        Rutina nueva = rutinaRepository.findById(copia.getId()).orElseThrow();
        nueva.setPlantillaOrigenId(plantillaId);
        asignacionRepo.findByRutinaIdAndSocioId(plantillaId, socioId).ifPresent(asignacionRepo::delete);
        return mapearAResponseDTO(rutinaRepository.save(nueva));
    }

    /** Socios que tienen asignada una plantilla */
    @Transactional(readOnly = true)
    public List<AsignacionDTO> asignadosDe(Long plantillaId) {
        plantilla(plantillaId);
        return asignacionRepo.dePlantilla(plantillaId).stream().map(this::asignacionDTO).toList();
    }

    /** Todas las asignaciones de socios activos (para ver qué rutinas hay que renovar) */
    @Transactional(readOnly = true)
    public List<AsignacionDTO> asignaciones() {
        return asignacionRepo.deSociosActivos().stream().map(this::asignacionDTO)
            .sorted(java.util.Comparator.comparingLong(AsignacionDTO::semanas).reversed())
            .toList();
    }

    private RutinaAsignacion crearAsignacion(Long plantillaId, Long socioId, boolean elegidaPorSocio) {
        Socio socio = socioRepository.findById(socioId)
            .orElseThrow(() -> new com.example.gymtrack_backend.web.RecursoNoEncontradoException("Socio no encontrado con id: " + socioId));
        if (!Boolean.TRUE.equals(socio.getActivo())) throw new IllegalStateException("El socio está dado de baja");
        RutinaAsignacion a = new RutinaAsignacion();
        a.setRutina(rutinaRepository.getReferenceById(plantillaId));
        a.setSocio(socio);
        a.setFechaAsignacion(java.time.LocalDateTime.now());
        a.setAsignadaPor(elegidaPorSocio ? "socio" : usuario());
        a.setElegidaPorSocio(elegidaPorSocio);
        return asignacionRepo.save(a);
    }

    private Rutina plantilla(Long plantillaId) {
        Rutina r = rutinaRepository.findById(plantillaId)
            .orElseThrow(() -> new com.example.gymtrack_backend.web.RecursoNoEncontradoException("Plantilla no encontrada"));
        if (r.getSocio() != null) throw new IllegalArgumentException("Esa rutina es de un socio, no es una plantilla");
        return r;
    }

    private AsignacionDTO asignacionDTO(RutinaAsignacion a) {
        int max = reglas.semanasMax();
        java.time.LocalDateTime desde = RutinasDelSocio.inicio(a);
        long semanas = ReglasRutina.semanas(desde, java.time.LocalDate.now());
        Socio s = a.getSocio();
        return new AsignacionDTO(a.getRutina().getId(), a.getRutina().getNombre(),
            s.getId(), s.getNombre() + " " + s.getApellido(), a.getFechaAsignacion(), desde, semanas, max, semanas >= max,
            Boolean.TRUE.equals(a.getElegidaPorSocio()), a.getAsignadaPor());
    }

    /** Una plantilla vista como rutina del socio que la tiene asignada */
    private RutinaResponseDTO mapearAsignacion(RutinaAsignacion a) {
        return mapearAsignacion(a, conteos(List.of(a.getRutina().getId())).get(a.getRutina().getId()));
    }

    private RutinaResponseDTO mapearAsignacion(RutinaAsignacion a, Conteo conteo) {
        RutinaResponseDTO dto = mapearAResponseDTO(a.getRutina(), conteo);
        Socio s = a.getSocio();
        java.time.LocalDateTime desde = RutinasDelSocio.inicio(a);
        long semanas = ReglasRutina.semanas(desde, java.time.LocalDate.now());
        dto.setAsignada(true);
        dto.setSocioId(s.getId());
        dto.setSocioNombre(s.getNombre() + " " + s.getApellido());
        dto.setFechaCreacion(a.getFechaAsignacion());
        dto.setFechaRenovacion(desde);
        dto.setSemanasActual(semanas);
        dto.setParaRenovar(semanas >= dto.getSemanasMax());
        dto.setElegidaPorSocio(a.getElegidaPorSocio());
        dto.setVisibleSocios(null);
        return dto;
    }

    private static String usuario() {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        String u = auth == null ? "sistema" : auth.getName();
        return u.length() > 50 ? u.substring(0, 50) : u;
    }

    private Rutina plantillaVisible(Long plantillaId) {
        Rutina r = rutinaRepository.findById(plantillaId).orElse(null);
        if (r == null || r.getSocio() != null || !Boolean.TRUE.equals(r.getVisibleSocios())) {
            throw new com.example.gymtrack_backend.web.RecursoNoEncontradoException("Plantilla no encontrada");
        }
        return r;
    }

    // ──────────────────────────────────────────────
    // HELPERS PRIVADOS
    // ──────────────────────────────────────────────

    /**
     * Busca una rutina y valida el acceso:
     * - Si socioId == null  → ADMIN / PROFESOR: acceso libre por ID
     * - Si socioId != null  → SOCIO: puede ver sus propias rutinas Y las rutinas generales
     *                         (socio_id IS NULL). No puede ver rutinas de OTRO socio.
     *
     * Usa findById + comprobación en memoria para evitar problemas con
     * findByIdAndSocioId cuando el Hibernate genera JOINs inesperados.
     */
    private Rutina findRutina(Long rutinaId, Long socioId) {
        Rutina rutina = rutinaRepository.findById(rutinaId)
            .orElseThrow(() -> new com.example.gymtrack_backend.web.RecursoNoEncontradoException("Rutina no encontrada"));

        if (socioId != null) {
            // Socio puede acceder a su propia rutina o a rutinas generales (sin socio)
            Socio socioRutina = rutina.getSocio();
            if (socioRutina != null && !socioRutina.getId().equals(socioId)) {
                throw new com.example.gymtrack_backend.web.RecursoNoEncontradoException("Rutina no encontrada");
            }
            if (socioRutina == null && !Boolean.TRUE.equals(rutina.getVisibleSocios()) && !acceso.esStaff()
                    && !asignacionRepo.existsByRutinaIdAndSocioId(rutinaId, socioId)) {
                throw new com.example.gymtrack_backend.web.RecursoNoEncontradoException("Rutina no encontrada");
            }
        }
        return rutina;
    }

    /** Ejercicios (sin la entrada en calor) y días distintos de una rutina */
    private record Conteo(int ejercicios, int dias) {}

    /** Conteos de varias rutinas en una sola consulta */
    private java.util.Map<Long, Conteo> conteos(java.util.Collection<Long> ids) {
        java.util.Map<Long, Conteo> m = new java.util.HashMap<>();
        if (ids.isEmpty()) return m;
        for (Object[] f : rutinaEjercicioRepository.resumenPorRutina(ids)) {
            m.put((Long) f[0], new Conteo(((Number) f[1]).intValue(), ((Number) f[2]).intValue()));
        }
        return m;
    }

    private RutinaResponseDTO mapearAResponseDTO(Rutina rutina) {
        return mapearAResponseDTO(rutina, conteos(List.of(rutina.getId())).get(rutina.getId()));
    }

    private RutinaResponseDTO mapearAResponseDTO(Rutina rutina, Conteo conteo) {
        RutinaResponseDTO dto = new RutinaResponseDTO();
        dto.setId(rutina.getId());
        dto.setNombre(rutina.getNombre());
        dto.setDescripcion(rutina.getDescripcion());
        dto.setTrenes(rutina.getTrenes() != null ? rutina.getTrenes() : new java.util.ArrayList<>());
        dto.setSocioId(rutina.getSocio() != null ? rutina.getSocio().getId() : null);
        dto.setSocioNombre(rutina.getSocio() != null
                ? rutina.getSocio().getNombre() + " " + rutina.getSocio().getApellido()
                : null);
        dto.setFechaCreacion(rutina.getFechaCreacion());
        dto.setDiasSemana(rutina.getDiasSemana());
        dto.setDificultad(rutina.getDificultad());
        dto.setObjetivo(rutina.getObjetivo());
        dto.setNotasProfe(rutina.getNotasProfe());
        // Antigüedad: desde la última vez que se cambiaron los ejercicios
        int max = reglas.semanasMax();
        long semanas = ReglasRutina.semanas(rutina, java.time.LocalDate.now());
        dto.setSemanasActual(semanas);
        dto.setSemanasMax(max);
        dto.setParaRenovar(rutina.getSocio() != null && semanas >= max);
        dto.setFechaRenovacion(ReglasRutina.inicio(rutina));
        dto.setVisibleSocios(rutina.getVisibleSocios());
        dto.setElegidaPorSocio(rutina.getElegidaPorSocio());

        // Resumen para tarjetas/previews (sin contar la entrada en calor)
        dto.setCantidadEjercicios(conteo == null ? 0 : conteo.ejercicios());
        dto.setCantidadDias(conteo == null ? 0 : conteo.dias());
        return dto;
    }

    private EjercicioResponseDTO mapearEjercicioADTO(RutinaEjercicio ej) {
        java.util.Map<Long, com.example.gymtrack_backend.entities.Maquina> maquinas = maquinaRepository.findAll().stream()
            .collect(Collectors.toMap(com.example.gymtrack_backend.entities.Maquina::getId, m -> m));
        return mapearEjercicioADTO(ej, maquinas);
    }

    private EjercicioResponseDTO mapearEjercicioADTO(RutinaEjercicio ej,
                                                     java.util.Map<Long, com.example.gymtrack_backend.entities.Maquina> maquinas) {
        EjercicioResponseDTO dto = new EjercicioResponseDTO();
        dto.setId(ej.getId());
        dto.setNombreEjercicio(ej.getNombreEjercicio());
        dto.setSeries(ej.getSeries());
        dto.setRepeticiones(ej.getRepeticiones());
        dto.setPesoKg(ej.getPesoKg());
        dto.setOrden(ej.getOrden());
        dto.setDescansoSeg(ej.getDescansoSeg());
        dto.setNotas(ej.getNotas());
        // Info del catálogo si está vinculado
        Ejercicio cat = ej.getEjercicioCatalogo();
        if (cat != null) {
            dto.setEjercicioCatalogoId(cat.getId());
            dto.setEsMaquina(cat.getEsMaquina());
            dto.setDescripcionEjercicio(cat.getDescripcion());
            dto.setGrupos(cat.getGrupos() != null ? cat.getGrupos() : new java.util.ArrayList<>());
            dto.setImagenUrl(cat.getImagenUrl());
            dto.setMaquinaIds(cat.getMaquinaIds() != null ? cat.getMaquinaIds() : new java.util.ArrayList<>());
            // Máquinas asociadas con su número, para que el socio sepa a cuál ir
            dto.setMaquinas(dto.getMaquinaIds().stream()
                .map(maquinas::get)
                .filter(m -> m != null && Boolean.TRUE.equals(m.getActiva()))
                .map(m -> new EjercicioResponseDTO.MaquinaResumen(m.getId(), m.getNombre(), m.getNroMaquina(), false))
                .toList());
        }
        // Sin máquina asociada: se sugiere la del gimnasio con el mismo nombre (si la coincidencia es clara)
        if (!ej.isEsCalentamiento() && dto.getMaquinas().isEmpty()) {
            String nombre = cat != null ? cat.getNombre() + " " + ej.getNombreEjercicio() : ej.getNombreEjercicio();
            dto.setMaquinas(SugerenciaMaquinas.sugerir(nombre, maquinas.values()).stream()
                .map(m -> new EjercicioResponseDTO.MaquinaResumen(m.getId(), m.getNombre(), m.getNroMaquina(), true))
                .toList());
        }
        dto.setEsCalentamiento(ej.isEsCalentamiento());
        dto.setDia(ej.getDia() != null ? ej.getDia() : 1);
        dto.setSuperserie(ej.getSuperserie());
        return dto;
    }

    /**
     * Agrega los 5 ejercicios estándar de movilidad/calentamiento a una rutina nueva.
     * Todos tienen esCalentamiento = true y orden 1..5, garantizando que siempre
     * aparezcan primero y no puedan ser eliminados por el usuario.
     */
    private void crearCalentamientoDefault(Rutina rutina) {
        record WarmUp(String nombre, int series, int reps, int descansoSeg, String notas) {}

        java.util.List<WarmUp> bloques = java.util.List.of(
            new WarmUp("Caminata / Trote suave",        1, 10,  0,  "5-10 minutos a paso moderado o trote liviano en cinta"),
            new WarmUp("Rotación de hombros",           2, 15, 15,  "Círculos amplios hacia adelante y hacia atrás"),
            new WarmUp("Movilidad de cadera",           2, 15, 15,  "Círculos de cadera en ambas direcciones"),
            new WarmUp("Sentadilla de movilidad",       2, 10, 20,  "Sin peso — enfocada en rango de movimiento y postura"),
            new WarmUp("Estiramiento de isquiotibiales",2, 30, 10,  "Posición sostenida 30 segundos por lado")
        );

        int orden = 1;
        for (WarmUp w : bloques) {
            RutinaEjercicio ej = new RutinaEjercicio();
            ej.setRutina(rutina);
            ej.setNombreEjercicio(w.nombre());
            ej.setSeries(w.series());
            ej.setRepeticiones(w.reps());
            ej.setDescansoSeg(w.descansoSeg());
            ej.setNotas(w.notas());
            ej.setOrden(orden++);
            ej.setEsCalentamiento(true);
            rutinaEjercicioRepository.save(ej);
        }
    }

    private static final java.util.Set<String> OBJETIVOS =
            java.util.Set.of("FUERZA", "HIPERTROFIA", "RESISTENCIA", "PERDIDA_GRASA", "SALUD");

    /** Valida el objetivo; vacío = sin especificar */
    private static String normalizarObjetivo(String objetivo) {
        if (objetivo == null || objetivo.isBlank()) return null;
        String o = objetivo.trim().toUpperCase();
        if (!OBJETIVOS.contains(o)) throw new IllegalArgumentException("Objetivo inválido: " + objetivo);
        return o;
    }
}
