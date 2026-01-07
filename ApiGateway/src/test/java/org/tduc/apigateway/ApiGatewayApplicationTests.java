package org.tduc.apigateway;


import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.web.reactive.server.WebTestClient;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ApiGatewayApplicationTests {

    @Autowired
    private WebTestClient webTestClient;

    @Test
    void testUserProfileRoute() {
        // This test assumes the user service is running and accessible
        webTestClient.get().uri("/api/users/profile/student")
                .exchange()
                .expectStatus().isOk()
                .expectBody().jsonPath("$.result.username").isEqualTo("student");
    }

    @Test
    void testClassroomTokenRoute() {
        // This test assumes the classroom service is running and accessible
        webTestClient.get().uri("/api/classrooms/getToken")
                .exchange()
                .expectStatus().isOk()
                .expectBody().jsonPath("$.token").exists();
    }

    @Test
    void testDownstreamErrorPropagation() {
        // This test assumes a downstream error is simulated for /api/classrooms/meeting/500
        webTestClient.get().uri("/api/classrooms/meeting/500")
                .exchange()
                .expectStatus().is5xxServerError();
    }

    @Test
    void contextLoads() {
    }

}
