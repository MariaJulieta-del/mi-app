package com.example.gymtrack_backend.service;

import com.example.gymtrack_backend.dto.EjercicioRequestDTO;
import com.example.gymtrack_backend.dto.EjercicioResponseDTO;
import com.example.gymtrack_backend.dto.EjercicioUpdateDTO;
import com.example.gymtrack_backend.dto.RutinaRequestDTO;
import com.example.gymtrack_backend.dto.RutinaResponseDTO;
import com.example.gymtrack_backend.entities.Ejercicio;
import com.example.gymtrack_backend.entities.Rutina;
import com.example.gymtrack_backend.entities.RutinaEjercicio;
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
                .orElseThrow(() -> new RuntimeException("Socio no encontrado con id: " + socioId));
            rutina.setSocio(socio);
        }
        // socioId == null → rutina general sin socio asignado

        // 1. Guardar la rutina en su propia transacción (commit inmediato)
        Rutina guardada = rutinaRepository.save(rutina);

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

    /** Devuelve las rutinas generales (sin socio asignado). Solo para ADMIN. */
    public List<RutinaResponseDTO> listarGenerales() {
        return rutinaRepository.findBySocioIsNull()
            .stream()
            .map(this::mapearAResponseDTO)
            .collect(Collectors.toList());
    }

    /** Devuelve las rutinas de un socio (para rol SOCIO o EMPLEADO con filtro). */
    public List<RutinaResponseDTO> obtenerRutinas(Long socioId) {
        return rutinaRepository.findBySocioId(socioId)
            .stream()
            .map(this::mapearAResponseDTO)
            .collect(Collectors.toList());
    }

    /** Devuelve TODAS las rutinas del sistema (para rol ADMIN). */
    public List<RutinaResponseDTO> listarTodas() {
        return rutinaRepository.findAll()
            .stream()
            .map(this::mapearAResponseDTO)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RutinaResponseDTO obtenerRutina(Long rutinaId, Long socioId) {
        Rutina rutina = findRutina(rutinaId, socioId);
        return mapearAResponseDTO(rutina);
    }

    @Transactional
    public RutinaResponseDTO actualizarRutina(Long rutinaId, Long socioId, RutinaRequestDTO dto) {
        Rutina rutina = findRutina(rutinaId, socioId);

        rutina.setNombre(dto.getNombre());
        rutina.setDescripcion(dto.getDescripcion());
        rutina.setDificultad(dto.getDificultad());
        rutina.setObjetivo(normalizarObjetivo(dto.getObjetivo()));
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

        return mapearEjercicioADTO(rutinaEjercicioRepository.save(ej));
    }

    /**
     * Actualiza series/reps/peso/descanso/notas de un ejercicio en la rutina.
     */
    @Transactional
    public EjercicioResponseDTO actualizarEjercicio(Long ejercicioId, Long rutinaId, Long socioId, EjercicioUpdateDTO dto) {
        findRutina(rutinaId, socioId);
        RutinaEjercicio ej = rutinaEjercicioRepository.findById(ejercicioId)
            .orElseThrow(() -> new RuntimeException("Ejercicio no encontrado"));
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
            .orElseThrow(() -> new RuntimeException("Ejercicio no encontrado"));
        if (ej.isEsCalentamiento()) {
            throw new IllegalStateException(
                "Los ejercicios de entrada en calor son inamovibles y no pueden eliminarse.");
        }
        rutinaEjercicioRepository.delete(ej);
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
            .orElseThrow(() -> new RuntimeException("Rutina no encontrada con id: " + rutinaOrigenId));

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
                .orElseThrow(() -> new RuntimeException("Socio no encontrado con id: " + socioDestinoId));
            nueva.setSocio(socio);
        }

        Rutina guardada = rutinaRepository.save(nueva);

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
            .orElseThrow(() -> new RuntimeException("Rutina no encontrada"));

        if (socioId != null) {
            // Socio puede acceder a su propia rutina o a rutinas generales (sin socio)
            Socio socioRutina = rutina.getSocio();
            if (socioRutina != null && !socioRutina.getId().equals(socioId)) {
                throw new RuntimeException("Rutina no pertenece al socio indicado");
            }
        }
        return rutina;
    }

    private RutinaResponseDTO mapearAResponseDTO(Rutina rutina) {
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

        // Resumen para tarjetas/previews (sin contar la entrada en calor)
        List<RutinaEjercicio> ejercicios = rutinaEjercicioRepository.findByRutinaIdOrderByOrden(rutina.getId());
        dto.setCantidadEjercicios((int) ejercicios.stream().filter(e -> !e.isEsCalentamiento()).count());
        dto.setCantidadDias((int) ejercicios.stream().filter(e -> !e.isEsCalentamiento())
                .map(e -> e.getDia() != null ? e.getDia() : 1).distinct().count());
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
