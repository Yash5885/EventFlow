package com.eventflow.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    OpenAPI eventFlowOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("EventFlow API")
                        .version("v1")
                        .description("Scalable event booking platform API"));
    }
}

