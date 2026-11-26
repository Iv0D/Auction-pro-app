package com.example.tpoDA.entities;

import java.util.Collection;
import java.util.List;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false, unique = true)
    private Client client;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    // Nullable: el usuario la setea después de activar la cuenta
    @Column(nullable = true, length = 255)
    private String password;

    // Estado del proceso de registro (manejado por el endpoint de admin)
    @Enumerated(EnumType.STRING)
    @Column(name = "registration_status", length = 15)
    @Builder.Default
    private RegistrationStatus registrationStatus = RegistrationStatus.PENDIENTE;

    @Column(name = "administrator")
    private Boolean administrator;

    public boolean isAdministrator() {
        return Boolean.TRUE.equals(administrator);
    }

    @Override
    public Collection<SimpleGrantedAuthority> getAuthorities() {
        var user = new SimpleGrantedAuthority("ROLE_USER");
        return isAdministrator() ? List.of(user, new SimpleGrantedAuthority("ROLE_ADMIN")) : List.of(user);
    }

    @Override public String getUsername() { return email; }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return password != null && (registrationStatus == RegistrationStatus.APROBADO || registrationStatus == null); }
}
