package com.example.gymtrack_backend.service;

import com.example.gymtrack_backend.dto.FichaMedicaRequestDTO;
import com.example.gymtrack_backend.entities.FichaMedica;
import com.example.gymtrack_backend.entities.Socio;
import com.example.gymtrack_backend.repository.FichaMedicaRepository;
import com.example.gymtrack_backend.repository.SocioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FichaMedicaService {

    private final FichaMedicaRepository fichaRepo;
    private final SocioRepository       socioRepo;

    public FichaMedica obtenerPorSocio(Long socioId) {
        return fichaRepo.findBySocioId(socioId)
                .orElse(new FichaMedica()); // retorna vacía si no existe aún
    }

    /** Crea o actualiza la ficha médica del socio */
    public FichaMedica guardar(Long socioId, FichaMedicaRequestDTO dto) {
        Socio socio = socioRepo.findById(socioId)
                .orElseThrow(() -> new com.example.gymtrack_backend.web.RecursoNoEncontradoException("Socio no encontrado: " + socioId));

        FichaMedica ficha = fichaRepo.findBySocioId(socioId).orElse(new FichaMedica());
        ficha.setSocio(socio);
        ficha.setLesiones(dto.getLesiones());
        ficha.setNivelAptitud(dto.getNivelAptitud() != null ? dto.getNivelAptitud() : "PRINCIPIANTE");
        ficha.setHistorialGimnasio(dto.getHistorialGimnasio());
        ficha.setDisponibilidad(dto.getDisponibilidad());
        ficha.setObservacionesMedicas(dto.getObservacionesMedicas());
        return fichaRepo.save(ficha);
    }
}
