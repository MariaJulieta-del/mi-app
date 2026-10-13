package com.example.gymtrack_backend;

import com.example.gymtrack_backend.entities.TarifaMembresia;
import com.example.gymtrack_backend.repository.TarifaMembresiaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Garantiza que los planes de membresía por defecto existan en la base de datos.
 * Si la tabla está vacía (por ejemplo, primera vez o por algún problema de migración),
 * inserta los 4 planes predeterminados.
 */
@Component
public class DataInitializer implements ApplicationRunner {

    @Autowired
    private TarifaMembresiaRepository tarifaRepository;

    @Override
    public void run(ApplicationArguments args) {
        if (tarifaRepository.count() == 0) {
            crearPlan("MENSUAL",    "Plan Mensual",     new BigDecimal("15000.00"), 30,
                "Acceso completo al gimnasio por 30 días. Clases grupales incluidas.");
            crearPlan("TRIMESTRAL", "Plan Trimestral",  new BigDecimal("40000.00"), 90,
                "Acceso completo por 90 días. Ahorrás $5.000 vs 3 meses por separado.");
            crearPlan("SEMESTRAL",  "Plan Semestral",   new BigDecimal("70000.00"), 180,
                "Acceso completo por 180 días. Ahorrás $20.000 vs 6 meses por separado.");
            crearPlan("ANUAL",      "Plan Anual",       new BigDecimal("120000.00"), 365,
                "Acceso completo por 365 días. Ahorrás $60.000 vs 12 meses por separado.");
        } else {
            // Actualiza duracion_dias y nombre si están en null (tablas creadas antes de V12)
            tarifaRepository.findAll().forEach(t -> {
                boolean changed = false;
                if (t.getDuracionDias() == null) {
                    t.setDuracionDias(diasPorDefecto(t.getTipo()));
                    changed = true;
                }
                if (t.getNombre() == null) {
                    t.setNombre(nombrePorDefecto(t.getTipo()));
                    changed = true;
                }
                if (changed) tarifaRepository.save(t);
            });
        }
    }

    private void crearPlan(String tipo, String nombre, BigDecimal precio, int dias, String incluye) {
        TarifaMembresia t = new TarifaMembresia();
        t.setTipo(tipo);
        t.setNombre(nombre);
        t.setPrecio(precio);
        t.setDuracionDias(dias);
        t.setIncluye(incluye);
        tarifaRepository.save(t);
    }

    private int diasPorDefecto(String tipo) {
        return switch (tipo) {
            case "MENSUAL"    -> 30;
            case "TRIMESTRAL" -> 90;
            case "SEMESTRAL"  -> 180;
            case "ANUAL"      -> 365;
            default           -> 30;
        };
    }

    private String nombrePorDefecto(String tipo) {
        return switch (tipo) {
            case "MENSUAL"    -> "Plan Mensual";
            case "TRIMESTRAL" -> "Plan Trimestral";
            case "SEMESTRAL"  -> "Plan Semestral";
            case "ANUAL"      -> "Plan Anual";
            default           -> "Plan " + tipo;
        };
    }
}
