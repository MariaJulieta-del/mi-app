package com.example.gymtrack_backend.demo;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Modo demo (solo en el servidor de la demo pública, con DEMO_MODE=true).
 * Nunca se activa en producción: por defecto está apagado.
 */
@Component
public class DemoConfig {

    @Value("${demo.habilitada:false}")
    private boolean habilitada;

    /** Usuarios de prueba con los que se entra sin contraseña */
    @Value("${demo.usuario-admin:carla}")
    private String usuarioAdmin;

    @Value("${demo.usuario-profesor:martin.demo}")
    private String usuarioProfesor;

    @Value("${demo.dni-socio:30100000}")
    private String dniSocio;

    public boolean habilitada() { return habilitada; }
    public String usuarioAdmin() { return usuarioAdmin; }
    public String usuarioProfesor() { return usuarioProfesor; }
    public String dniSocio() { return dniSocio; }
}
