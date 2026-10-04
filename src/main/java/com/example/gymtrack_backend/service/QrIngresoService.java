package com.example.gymtrack_backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;

/**
 * QR de ingreso rotativo.
 *
 * La pantalla de recepción muestra un código que cambia cada {@link #VENTANA_SEG} segundos:
 *   GT1.{ventana}.{firma}   donde firma = HMAC-SHA256(secreto, "ingreso:" + ventana)
 *
 * El socio lo escanea desde su cuenta y recién ahí se registra el ingreso (y se consume el pase).
 * Como el código vence enseguida, una foto del QR no sirve para "ingresar" desde otro lugar.
 */
@Service
public class QrIngresoService {

    public static final int VENTANA_SEG = 30;
    /** Ventanas anteriores que se siguen aceptando (margen para escanear y por desfasaje de reloj) */
    private static final int VENTANAS_TOLERANCIA = 2;
    private static final String PREFIJO = "GT1";

    private final byte[] secreto;

    public QrIngresoService(@Value("${qr.secret:${jwt.secret}}") String secreto) {
        this.secreto = ("qr-ingreso:" + secreto).getBytes(StandardCharsets.UTF_8);
    }

    public record CodigoQr(String codigo, int expiraEnSeg, int ventanaSeg) {}

    public CodigoQr codigoActual() {
        long ahora = Instant.now().getEpochSecond();
        long ventana = ahora / VENTANA_SEG;
        int expira = (int) (VENTANA_SEG - (ahora % VENTANA_SEG));
        return new CodigoQr(PREFIJO + "." + ventana + "." + firmar(ventana), expira, VENTANA_SEG);
    }

    /** true si el código fue generado por este servidor y todavía no venció */
    public boolean esValido(String codigo) {
        if (codigo == null) return false;
        String[] partes = codigo.trim().split("\\.");
        if (partes.length != 3 || !PREFIJO.equals(partes[0])) return false;

        long ventana;
        try { ventana = Long.parseLong(partes[1]); }
        catch (NumberFormatException e) { return false; }

        long actual = Instant.now().getEpochSecond() / VENTANA_SEG;
        if (ventana > actual || ventana < actual - VENTANAS_TOLERANCIA) return false;

        return MessageDigest.isEqual(
                firmar(ventana).getBytes(StandardCharsets.US_ASCII),
                partes[2].getBytes(StandardCharsets.US_ASCII));
    }

    private String firmar(long ventana) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secreto, "HmacSHA256"));
            byte[] h = mac.doFinal(("ingreso:" + ventana).getBytes(StandardCharsets.UTF_8));
            // 16 bytes alcanzan y dejan un QR chico y fácil de leer
            return Base64.getUrlEncoder().withoutPadding().encodeToString(java.util.Arrays.copyOf(h, 16));
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo firmar el código QR", e);
        }
    }
}
