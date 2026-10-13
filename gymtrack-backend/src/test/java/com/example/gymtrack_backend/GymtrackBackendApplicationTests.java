package com.example.gymtrack_backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/** Levanta la app completa contra la base de PRUEBA (perfil "test"), nunca contra gymtrack_db */
@SpringBootTest
@ActiveProfiles("test")
class GymtrackBackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
