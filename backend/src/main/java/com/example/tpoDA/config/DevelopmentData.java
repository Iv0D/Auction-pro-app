package com.example.tpoDA.config;

import com.example.tpoDA.entities.*;
import com.example.tpoDA.repositories.EmployeeRepository;
import com.example.tpoDA.repositories.UserRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Component
@Profile("local")
@RequiredArgsConstructor
public class DevelopmentData implements ApplicationRunner {

    private static final String DEMO_PASSWORD = "Demo-AuctionPro-2026";
    private static final String DEMO_BUYER = "comprador@auctionpro.test";

    private final EntityManager em;
    private final EmployeeRepository employees;
    private final UserRepository users;
    private final PasswordEncoder passwords;

    @Value("${app.demo.enabled:false}")
    private boolean demoEnabled;

    @Value("${app.admin.email:}")
    private String adminEmail;

    @Value("${app.admin.password:}")
    private String adminPassword;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Employee verifier = employees.findRandom().orElseGet(() ->
            employees.save(Employee.builder().id(1).position("Verificador local").build()));

        if (!adminEmail.isBlank() || !adminPassword.isBlank()) {
            if (adminEmail.isBlank() || adminPassword.length() < 12
                    || adminPassword.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72) {
                throw new IllegalArgumentException("Configurá ADMIN_EMAIL y una ADMIN_PASSWORD de al menos 12 caracteres y hasta 72 bytes");
            }
            provisionAdmin(adminEmail.trim(), adminPassword, verifier);
        }

        if (demoEnabled) {
            User operator = provisionAdmin("rematador@auctionpro.test", DEMO_PASSWORD, verifier);
            if (users.findByEmail(DEMO_BUYER).isEmpty()) {
                seedDemo(operator, verifier);
            }
        }
    }

    private User provisionAdmin(String email, String password, Employee verifier) {
        return users.findByEmail(email).map(user -> {
            if (!user.isAdministrator()) {
                throw new IllegalStateException("El correo configurado para administración ya corresponde a otra cuenta");
            }
            return user;
        }).orElseGet(() -> createAccount(email, password, "Rematador",
            "OP-" + java.util.UUID.randomUUID().toString().substring(0, 12), verifier, true));
    }

    private User createAccount(String email, String password, String name, String document,
                               Employee verifier, boolean administrator) {
        Person person = persist(Person.builder().name(name).document(document).status(PersonStatus.ACTIVO).build());
        Client client = persist(Client.builder().person(person).verifier(verifier)
            .admitted("si").category(ClientCategory.COMUN).build());
        return users.save(User.builder().client(client).email(email).password(passwords.encode(password))
            .registrationStatus(RegistrationStatus.APROBADO).administrator(administrator).build());
    }

    private void seedDemo(User operator, Employee verifier) {
        User buyer = createAccount(DEMO_BUYER, DEMO_PASSWORD, "Comprador de prueba", "DEMO-COMPRADOR", verifier, false);
        persist(PaymentMethod.builder().user(buyer).tipo(PaymentMethodTipo.CHEQUE_CERTIFICADO)
            .montoGarantizado(BigDecimal.valueOf(120)).moneda("ARS")
            .verificado(true).estado("VERIFICADO").build());

        LocalDate today = LocalDate.now();
        Auction auction = persist(Auction.builder().date(today.minusDays(1)).time(LocalTime.NOON)
            .status(AuctionStatus.ABIERTA).category(ClientCategory.COMUN)
            .location("Sala de demostración").capacity(20).build());
        Catalog catalog = persist(Catalog.builder().auction(auction).responsible(verifier)
            .description("Colección de demostración").build());
        Owner owner = persist(Owner.builder().person(operator.getClient().getPerson()).verifier(verifier).build());

        seedLot(catalog, owner, verifier, today, "Cámara analógica",
            "Cámara de colección con lente de 50 mm.", 100);
        seedLot(catalog, owner, verifier, today, "Reloj de escritorio",
            "Pieza de sobremesa con caja de madera.", 200);
    }

    private void seedLot(Catalog catalog, Owner owner, Employee verifier, LocalDate date,
                         String name, String description, int basePrice) {
        Product product = persist(NormalProduct.builder().name(name).quantity(1).isOwnerConfirmed("si")
            .catalogDescription(description).fullDescription(description).available("si")
            .date(date).owner(owner).reviewer(verifier).build());
        persist(CatalogItem.builder().catalog(catalog).product(product).basePrice(BigDecimal.valueOf(basePrice))
            .commission(BigDecimal.TEN).auctioned("no").build());
    }

    private <T> T persist(T entity) {
        em.persist(entity);
        return entity;
    }
}
