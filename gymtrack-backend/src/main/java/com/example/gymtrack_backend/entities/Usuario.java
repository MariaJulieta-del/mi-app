package com.example.gymtrack_backend.entities;

import com.example.gymtrack_backend.entities.enums.Rol;
import jakarta.persistence.*;
import lombok.Data;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Data
@Entity
@EntityListeners(com.example.gymtrack_backend.security.SesionesCache.Oyente.class)
@Table(name = "usuarios")
public class Usuario implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    private String email;

    private String nombre;
    private String apellido;
    private String telefono;
    private String especialidad;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Rol rol = Rol.PROFESOR;

    @Column(nullable = false)
    private boolean activo = true;

    /**
     * Cuándo cambió por última vez la credencial (PIN del socio o contraseña del staff).
     * Los tokens emitidos antes de esta fecha dejan de valer: al cambiarla se cierran las sesiones viejas.
     * Socios: null = todavía no tiene PIN (no puede entrar). Staff: null = nunca la cambió.
     */
    private java.time.LocalDateTime pinActualizado;

    // Relación opcional: si el usuario es un SOCIO, apunta a su registro
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "socio_id")
    private Socio socio;

    // ── UserDetails implementation ──────────────────────────────────────────

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + rol.name()));
    }

    @Override
    public boolean isAccountNonExpired()  { return true; }

    @Override
    public boolean isAccountNonLocked()   { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return activo; }
}
