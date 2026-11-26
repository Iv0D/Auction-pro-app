package com.example.tpoDA.config;

import com.example.tpoDA.entities.Employee;
import com.example.tpoDA.repositories.EmployeeRepository;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("local")
public class DevelopmentData {

    @Bean
    ApplicationRunner seedVerifier(EmployeeRepository employees) {
        return args -> {
            if (employees.count() == 0) {
                employees.save(Employee.builder().id(1).position("Verificador local").build());
            }
        };
    }
}
