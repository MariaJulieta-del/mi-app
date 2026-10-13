package com.example.gymtrack_backend.service;

import com.example.gymtrack_backend.dto.MaquinaRequestDTO;
import com.example.gymtrack_backend.entities.Maquina;
import com.example.gymtrack_backend.repository.MaquinaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MaquinaService {

    private final MaquinaRepository repo;
    private final com.example.gymtrack_backend.repository.MantenimientoRepository mantenimientoRepo;

    /**
     * Borra la máquina. Si tiene arreglos registrados no se borra (se perdería el historial y lo gastado):
     * en ese caso hay que deshabilitarla. Se saca de los ejercicios que la usaban.
     */
    @org.springframework.transaction.annotation.Transactional
    public void eliminar(Long id) {
        Maquina m = obtener(id);
        long arreglos = mantenimientoRepo.countByMaquinaId(id);
        if (arreglos > 0) {
            throw new IllegalStateException(m.getNombre() + " tiene " + arreglos + (arreglos == 1 ? " arreglo registrado" : " arreglos registrados")
                    + ": deshabilitala para conservar el historial y lo gastado.");
        }
        repo.quitarDeEjercicios(id);
        repo.delete(m);
    }

    public List<Maquina> listarActivas() { return repo.findByActivaTrue(); }
    public List<Maquina> listarTodas()   { return repo.findAll(); }

    public Maquina obtener(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new com.example.gymtrack_backend.web.RecursoNoEncontradoException("Máquina no encontrada: " + id));
    }

    @Transactional
    public Maquina crear(MaquinaRequestDTO dto) {
        // Solo validar unicidad si se proporciona un número (barras/mancuernas pueden no tenerlo)
        if (dto.getNroMaquina() != null && !dto.getNroMaquina().isBlank()
                && repo.existsByNroMaquina(dto.getNroMaquina())) {
            throw new RuntimeException("Ya existe una máquina con el número: " + dto.getNroMaquina());
        }
        Maquina m = new Maquina();
        mapear(dto, m);
        return repo.save(m);
    }

    @Transactional
    public Maquina actualizar(Long id, MaquinaRequestDTO dto) {
        Maquina m = obtener(id);
        String nuevoNro = dto.getNroMaquina();
        String actualNro = m.getNroMaquina();
        // Validar unicidad solo si se está cambiando a un número diferente
        boolean cambioNro = nuevoNro != null && !nuevoNro.isBlank()
                && !nuevoNro.equals(actualNro);
        if (cambioNro && repo.existsByNroMaquina(nuevoNro)) {
            throw new RuntimeException("Ya existe una máquina con el número: " + nuevoNro);
        }
        mapear(dto, m);
        return repo.save(m);
    }

    public void desactivar(Long id) {
        Maquina m = obtener(id);
        m.setActiva(false);
        repo.save(m);
    }

    public Maquina activar(Long id) {
        Maquina m = obtener(id);
        m.setActiva(true);
        return repo.save(m);
    }

    private void mapear(MaquinaRequestDTO dto, Maquina m) {
        // null / blank → sin número (barras, mancuernas, accesorios genéricos)
        String nro = dto.getNroMaquina();
        m.setNroMaquina((nro != null && !nro.isBlank()) ? nro : null);
        m.setNombre(dto.getNombre());
        m.setDescripcion(dto.getDescripcion());
        if (dto.getGrupos() != null) {
            m.getGrupos().clear();
            m.getGrupos().addAll(dto.getGrupos());
        }
        m.setInstruccionesUso(dto.getInstruccionesUso());
        m.setAjustes(dto.getAjustes());
        if (dto.getActiva() != null) m.setActiva(dto.getActiva());
    }
}
