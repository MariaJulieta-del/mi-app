package com.example.gymtrack_backend.auditoria;

import com.example.gymtrack_backend.repository.SocioRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Registra en la tabla "auditoria" toda operación que modifica datos (POST/PUT/PATCH/DELETE)
 * y terminó bien. No hace falta tocar cada servicio: la acción se deduce de la ruta.
 * Un servicio puede sumar detalle con {@link #detalle(String)} (ej. el plan y el monto de un cobro).
 */
@Component
@RequiredArgsConstructor
public class AuditoriaInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(AuditoriaInterceptor.class);
    private static final String ATTR_DETALLE = "auditoria.detalle";
    private static final String ATTR_SOCIO = "auditoria.socioId";

    private final AuditoriaRepository repo;
    private final SocioRepository socioRepo;

    /** Regla: método + ruta → acción. Si la ruta tiene el ID de un socio, va en el grupo "socio". */
    private record Regla(String metodo, Pattern ruta, String accion) {}

    private static Regla r(String metodo, String ruta, String accion) {
        return new Regla(metodo, Pattern.compile("^/api/v1" + ruta + "$"), accion);
    }

    private static final List<Regla> REGLAS = List.of(
            r("POST",   "/pagos/con-membresia",                         "Cobró un plan"),
            r("PATCH",  "/membresias/\\d+/estado",                       "Cambió el estado de una membresía"),
            r("POST",   "/socios/alta",                                  "Dio de alta un socio"),
            r("POST",   "/socios",                                       "Dio de alta un socio"),
            r("PUT",    "/socios/(?<socio>\\d+)",                        "Editó los datos del socio"),
            r("DELETE", "/socios/(?<socio>\\d+)",                        "Dio de baja al socio"),
            r("DELETE", "/socios/(?<socio>\\d+)/permanente",             "Eliminó definitivamente al socio"),
            r("PUT",    "/socios/(?<socio>\\d+)/reactivar",              "Reactivó al socio"),
            r("POST",   "/disciplinas",                                  "Creó una disciplina"),
            r("PUT",    "/disciplinas/\\d+",                             "Editó una disciplina"),
            r("PATCH",  "/disciplinas/\\d+/activa",                      "Activó/desactivó una disciplina"),
            r("POST",   "/disciplinas/\\d+/inscripciones",               "Inscribió a un socio en una disciplina"),
            r("DELETE", "/disciplinas/\\d+/inscripciones/(?<socio>\\d+)", "Quitó a un socio de una disciplina"),
            r("POST",   "/disciplinas/\\d+/liberar-cupos",               "Liberó cupos de una disciplina"),
            r("PUT",    "/fichas-medicas/socio/(?<socio>\\d+)",          "Editó la ficha médica"),
            r("POST",   "/tarifas",                                      "Creó un plan"),
            r("PUT",    "/tarifas/[^/]+",                                "Modificó un plan (precio o pases)"),
            r("POST",   "/egresos",                                      "Registró un egreso de caja"),
            r("DELETE", "/egresos/\\d+",                                 "Eliminó un egreso de caja"),
            r("POST",   "/cierre-caja",                                  "Cerró la caja"),
            r("POST",   "/profesores",                                   "Creó un profesor"),
            r("PUT",    "/profesores/\\d+",                              "Editó un profesor"),
            r("PATCH",  "/profesores/\\d+/toggle",                       "Activó/desactivó un profesor"),
            r("DELETE", "/profesores/\\d+",                              "Eliminó un profesor"),
            r("POST",   "/auth/register",                                "Creó un usuario"),
            r("POST",   "/socios/(?<socio>\\d+)/pin",                  "Generó un PIN nuevo para el socio"),
            r("POST",   "/auth/pines-pendientes",                        "Generó los PIN de los socios que no tenían"),
            r("POST",   "/auth/cambiar-pin",                             "Cambió su PIN"),
            r("POST",   "/rutinas",                                      "Creó una rutina"),
            r("POST",   "/rutinas/\\d+/clonar",                          "Asignó/copió una rutina"),
            r("PUT",    "/rutinas/\\d+",                                 "Editó una rutina"),
            r("DELETE", "/rutinas/\\d+",                                 "Eliminó una rutina"),
            r("POST",   "/notificaciones",                               "Envió una notificación"),
            r("POST",   "/disciplinas/\\d+/avisos",                     "Envió un aviso a los alumnos de una disciplina"),
            r("POST",   "/ejercicios/limpieza",                          "Borró ejercicios viejos"),
            r("DELETE", "/ejercicios/\\d+/permanente",                  "Borró un ejercicio"),
            r("POST",   "/kiosco",                                       "Vinculó una pantalla de recepción"),
            r("DELETE", "/kiosco/\\d+",                              "Desvinculó una pantalla de recepción"),
            r("PUT",    "/socios/(?<socio>\\d+)/baja",                  "Dio de baja al socio"),
            r("POST",   "/rutinas/\\d+/asignar",                         "Asignó una plantilla de rutina"),
            r("DELETE", "/rutinas/\\d+/asignaciones/(?<socio>\\d+)",    "Le quitó una plantilla de rutina al socio"),
            r("POST",   "/rutinas/\\d+/personalizar",                    "Copió y ajustó una plantilla para un socio"),
            r("PATCH",  "/rutinas/\\d+/visible",                         "Mostró/ocultó una plantilla en la app"),
            r("PATCH",  "/pedidos-rutina/\\d+/tomar",                    "Tomó un pedido de rutina"),
            r("PATCH",  "/pedidos-rutina/\\d+/hecho",                    "Resolvió un pedido de rutina"),
            r("PATCH",  "/pedidos-rutina/\\d+/descartar",                "Descartó un pedido de rutina"),
            r("POST",   "/socio-app/rutinas/pedido",                     "Pidió una rutina a medida"),
            r("POST",   "/mantenimientos",                               "Reportó una falla o mantenimiento de máquina"),
            r("PUT",    "/mantenimientos/\\d+",                          "Actualizó un mantenimiento de máquina"),
            r("DELETE", "/mantenimientos/\\d+",                          "Eliminó un registro de mantenimiento"),
            r("POST",   "/maquinas",                                     "Creó una máquina"),
            r("PUT",    "/maquinas/\\d+",                                "Editó una máquina"),
            r("DELETE", "/maquinas/\\d+",                                "Deshabilitó una máquina"),
            r("DELETE", "/maquinas/\\d+/definitivo",                     "Eliminó definitivamente una máquina"),
            r("PATCH",  "/maquinas/\\d+/activar",                        "Habilitó una máquina"),
            r("PUT",    "/configuracion/marca",                          "Cambió el nombre, logo o color del gimnasio"),
            r("PUT",    "/configuracion/rutinas",                        "Cambió cada cuántas semanas se renuevan las rutinas"),
            r("PUT",    "/recordatorios-cuota",                          "Cambió la configuración de recordatorios de cuota"),
            r("POST",   "/recordatorios-cuota/ejecutar",                 "Mandó los recordatorios de cuota"),
            r("POST",   "/backups",                                      "Hizo una copia de seguridad"),
            r("POST",   "/retencion/generar",                            "Revisó los socios en riesgo"),
            r("PATCH",  "/retencion/tareas/\\d+",                        "Actualizó una tarea para no perder socios"),
            r("PATCH",  "/tarifas/[^/]+/activo",                         "Activó/desactivó un plan"),
            r("DELETE", "/tarifas/[^/]+",                                "Eliminó un plan"),
            r("POST",   "/reservas",                                     "Reservó una clase"),
            r("POST",   "/reservas/cancelar",                            "Canceló una reserva de clase"),
            r("POST",   "/reservas/disciplinas/\\d+/fijo",               "Se anotó como alumno fijo"),
            r("DELETE", "/reservas/disciplinas/\\d+/fijo",               "Dejó de ser alumno fijo"),
            r("POST",   "/sesiones",                                     "Registró un entrenamiento"),
            r("PUT",    "/gamificacion/ranking",                         "Cambió su participación en el ranking")
    );

    /** Rutas que NO se auditan: uso cotidiano o muy frecuente */
    private static final List<Pattern> IGNORAR = List.of(
            Pattern.compile("^/api/v1/auth/login.*"),
            Pattern.compile("^/api/v1/asistencias/.*"),
            Pattern.compile("^/api/v1/progreso.*"),
            Pattern.compile("^/api/v1/rutinas/\\d+/ejercicios.*")
    );

    /** Para que un servicio agregue información al registro de la operación actual */
    public static void detalle(String detalle) {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs) {
            attrs.getRequest().setAttribute(ATTR_DETALLE, detalle);
        }
    }

    /** Para que un servicio indique el socio afectado cuando no está en la ruta */
    public static void socio(Long socioId) {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs) {
            attrs.getRequest().setAttribute(ATTR_SOCIO, socioId);
        }
    }

    @Override
    public void afterCompletion(HttpServletRequest req, HttpServletResponse res, Object handler, Exception ex) {
        String metodo = req.getMethod();
        if ("GET".equals(metodo) || "OPTIONS".equals(metodo) || "HEAD".equals(metodo)) return;
        if (ex != null || res.getStatus() >= 400) return;
        String ruta = req.getRequestURI();
        if (IGNORAR.stream().anyMatch(p -> p.matcher(ruta).matches())) return;

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) return;

        try {
            Auditoria a = new Auditoria();
            a.setFecha(LocalDateTime.now());
            a.setUsuario(auth.getName());
            a.setRol(auth.getAuthorities().stream().findFirst().map(g -> g.getAuthority().replace("ROLE_", "")).orElse(null));
            a.setRecurso(metodo + " " + ruta);
            a.setIp(req.getRemoteAddr());
            a.setDetalle((String) req.getAttribute(ATTR_DETALLE));

            Long socioId = (Long) req.getAttribute(ATTR_SOCIO);
            String accion = null;
            for (Regla regla : REGLAS) {
                if (!regla.metodo().equals(metodo)) continue;
                Matcher m = regla.ruta().matcher(ruta);
                if (m.matches()) {
                    accion = regla.accion();
                    if (socioId == null && regla.ruta().pattern().contains("?<socio>")) socioId = Long.valueOf(m.group("socio"));
                    break;
                }
            }
            if (accion == null) accion = "Modificó " + recursoLegible(ruta);
            a.setAccion(accion);
            if (socioId != null) {
                a.setSocioId(socioId);
                socioRepo.findById(socioId).ifPresent(s -> a.setSocioNombre(s.getNombre() + " " + s.getApellido()));
            }
            repo.save(a);
        } catch (Exception e) {
            // La auditoría nunca debe romper la operación del usuario
            log.warn("No se pudo registrar la auditoría de {} {}: {}", metodo, ruta, e.getMessage());
        }
    }

    private static String recursoLegible(String ruta) {
        String[] partes = ruta.replace("/api/v1/", "").split("/");
        return partes.length > 0 ? partes[0].replace('-', ' ') : ruta;
    }
}
