package com.example.gymtrack_backend.service;

import com.example.gymtrack_backend.entities.Asistencia;
import com.example.gymtrack_backend.entities.Socio;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class DemografiaTest {

    private static final LocalDate HOY = LocalDate.of(2026, 10, 8);

    private static Socio socio(long id, Integer edad, String genero, boolean activo) {
        Socio s = new Socio();
        s.setId(id);
        s.setActivo(activo);
        s.setGenero(genero);
        if (edad != null) s.setFechaNacimiento(HOY.minusYears(edad).minusDays(10));
        return s;
    }

    private static Asistencia visita(Socio s, int hora, int minuto) {
        Asistencia a = new Asistencia();
        a.setSocio(s);
        a.setFecha(HOY.minusDays(1));
        a.setHora(LocalTime.of(hora, minuto));
        a.setTipo("ENTRADA");
        a.setPermitido(true);
        return a;
    }

    @Test
    void edadPromedioYGruposPorGeneroYEdad() {
        Socio ana = socio(1, 22, "FEMENINO", true);
        Socio beto = socio(2, 40, "MASCULINO", true);
        Socio cami = socio(3, 30, "NO_BINARIO", true);
        Socio sinDatos = socio(4, null, null, true);
        Socio inactivo = socio(5, 70, "MASCULINO", false);

        List<Asistencia> v = new ArrayList<>();
        v.add(visita(ana, 7, 30));
        v.add(visita(ana, 8, 30));
        v.add(visita(beto, 19, 0));
        v.add(visita(inactivo, 10, 0));          // cuenta para las franjas aunque hoy esté inactivo
        Asistencia denegada = visita(cami, 12, 0);
        denegada.setPermitido(false);              // no cuenta
        v.add(denegada);

        var d = DemografiaService.calcular(List.of(ana, beto, cami, sinDatos, inactivo), v, HOY, 14);

        assertEquals(4, d.sociosActivos());
        assertEquals(3, d.conEdad());
        assertEquals(30.7, d.edadPromedio(), 0.01);
        assertEquals(22, d.edadMinima());
        assertEquals(40, d.edadMaxima());
        assertEquals(4, d.visitas());

        var fem = d.generos().get(0);
        assertEquals("Femenino", fem.nombre());
        assertEquals(1, fem.socios());
        assertEquals(33, fem.porcentaje());
        assertEquals(2, fem.visitas());
        assertEquals(1.0, fem.visitasPorSemana(), 0.01);   // 2 visitas en 2 semanas
        assertEquals(100, fem.franjas().get(0));            // todas antes de las 9
        assertEquals("08:00", fem.horaPromedio());

        var masc = d.generos().get(1);
        assertEquals(1, masc.socios(), "el inactivo no suma como socio");
        assertEquals(2, masc.visitas(), "pero sus visitas del período sí");

        var rango18a24 = d.edades().get(1);
        assertEquals(1, rango18a24.socios());
        var rango60 = d.edades().get(5);
        assertEquals(0, rango60.socios());
        assertNull(rango60.visitasPorSemana());

        // Franja 18 a 21: solo Beto (40 años)
        var noche = d.franjas().get(4);
        assertEquals(1, noche.visitas());
        assertEquals(40.0, noche.edadPromedio(), 0.01);
        assertEquals(50, d.franjas().get(0).porcentaje());
    }

    @Test
    void sinDatosNoRompe() {
        var d = DemografiaService.calcular(List.of(), List.of(), HOY, 60);
        assertNull(d.edadPromedio());
        assertEquals(0, d.visitas());
        assertNull(d.franjas().get(0).porcentaje());
    }

    @Test
    void elGeneroSeNormalizaYSeValida() {
        assertEquals("NO_BINARIO", SocioService.normalizarGenero("no binario"));
        assertEquals("FEMENINO", SocioService.normalizarGenero("femenino"));
        assertNull(SocioService.normalizarGenero(""));
        assertThrows(IllegalArgumentException.class, () -> SocioService.normalizarGenero("otro"));
        assertThrows(IllegalArgumentException.class, () -> SocioService.validarNacimiento(LocalDate.now().plusDays(1)));
    }
}
