package com.example.gymtrack_backend.repository;

import com.example.gymtrack_backend.entities.Notificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {
    List<Notificacion> findByActivaTrueOrderByFechaCreacionDesc();

    /** Historial para el staff (activos y archivados), del más nuevo al más viejo */
    List<Notificacion> findTop300ByOrderByFechaCreacionDesc();
    List<Notificacion> findBySocioIdAndActivaTrueOrderByFechaCreacionDesc(Long socioId);

    /** Avisos que le corresponden a un socio: a todos, a él, o a una disciplina en la que está inscripto */
    @org.springframework.data.jpa.repository.Query("""
            select n from Notificacion n
            where n.activa = true and n.fechaCreacion >= :desde and (
                n.destinatario = 'TODOS'
                or (n.destinatario = 'SOCIO' and n.socio.id = :socioId)
                or (n.destinatario = 'DISCIPLINA' and n.disciplina.id in :disciplinas))
            order by n.fechaCreacion desc
            """)
    List<Notificacion> findParaSocio(@org.springframework.data.repository.query.Param("socioId") Long socioId,
                                     @org.springframework.data.repository.query.Param("disciplinas") java.util.Collection<Long> disciplinas,
                                     @org.springframework.data.repository.query.Param("desde") java.time.LocalDateTime desde);
}
