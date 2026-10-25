package com.example.gymtrack_backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * Utilidad JWT: genera, parsea y valida tokens.
 * Usa HMAC-SHA256 con una clave configurada en application.properties.
 */
@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration-ms}")
    private long expirationMs;

    @Value("${app.produccion:false}")
    private boolean produccion;

    /** Secreto de ejemplo que trae el repo: sirve solo para desarrollo local */
    private static final String SECRETO_DE_EJEMPLO = "GymTrackSecretKey2026SpringBoot4JJWT012xMuyLargoParaHMACSHA256Seguridad";

    @jakarta.annotation.PostConstruct
    void validarSecreto() {
        if (secret == null || secret.length() < 32) {
            throw new IllegalStateException("JWT_SECRET debe tener al menos 32 caracteres");
        }
        if (SECRETO_DE_EJEMPLO.equals(secret)) {
            if (produccion) {
                throw new IllegalStateException("En producción hay que definir JWT_SECRET con un valor propio");
            }
            org.slf4j.LoggerFactory.getLogger(JwtUtil.class)
                    .warn("Usando el JWT_SECRET de ejemplo. Definí JWT_SECRET antes de publicar la app.");
        }
    }

    // ── Clave de firma ───────────────────────────────────────────────────────
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    // ── Generación ───────────────────────────────────────────────────────────
    public String generateToken(UserDetails userDetails, String rol) {
        return generateToken(userDetails, rol, expirationMs);
    }

    /** Token con una duración propia (ej. socios: sesión larga en su celular) */
    public String generateToken(UserDetails userDetails, String rol, long expirationMs) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("rol", rol);
        conCopiaDemo(claims);

        return Jwts.builder()
                .claims(claims)
                .id(java.util.UUID.randomUUID().toString())
                .subject(userDetails.getUsername())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(getSigningKey())
                .compact();
    }

    /** Demo pública: copia de los datos de prueba del visitante (ver DemoEsquemas) */
    public static final String CLAIM_DEMO = "demo";

    /** En la demo, la sesión lleva la copia del visitante del pedido en curso; fuera de la demo no hay ninguna */
    private static void conCopiaDemo(Map<String, Object> claims) {
        String esquema = com.example.gymtrack_backend.demo.DemoContexto.actual();
        if (esquema != null) claims.put(CLAIM_DEMO, esquema);
    }

    /** Prefijo del "usuario" de las pantallas de recepción: kiosco:{id} */
    public static final String PREFIJO_KIOSCO = "kiosco:";

    /** Token de una pantalla de recepción (no corresponde a ningún usuario) */
    public String generateKioscoToken(Long dispositivoId, long expirationMs) {
        Map<String, Object> claims = new HashMap<>(Map.of("rol", "KIOSCO"));
        conCopiaDemo(claims);
        return Jwts.builder()
                .claims(claims)
                .id(java.util.UUID.randomUUID().toString())
                .subject(PREFIJO_KIOSCO + dispositivoId)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(getSigningKey())
                .compact();
    }

    // ── Extracción de datos ──────────────────────────────────────────────────
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String extractRol(String token) {
        return extractClaim(token, claims -> claims.get("rol", String.class));
    }

    public Date extractIssuedAt(String token) {
        return extractClaim(token, Claims::getIssuedAt);
    }

    /** Identificador del token (null en tokens viejos, emitidos antes de que existiera) */
    public String extractId(String token) {
        return extractClaim(token, Claims::getId);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> resolver) {
        return resolver.apply(extractAllClaims(token));
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    // ── Validación ───────────────────────────────────────────────────────────
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }
}
