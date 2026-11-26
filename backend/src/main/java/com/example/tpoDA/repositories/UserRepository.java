package com.example.tpoDA.repositories;

import com.example.tpoDA.entities.User;
import com.example.tpoDA.entities.RegistrationStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {

    Optional<User> findByEmail(String email);

    Optional<User> findByClientId(Integer clientId);

    List<User> findByRegistrationStatusOrderByIdAsc(RegistrationStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM User u WHERE u.client.id = :clientId")
    Optional<User> findByClientIdForUpdate(@Param("clientId") Integer clientId);

    // Para buscar el usuario a partir del Owner (mismo ID que Person)
    @Query("SELECT u FROM User u WHERE u.client.person.id = :ownerId")
    Optional<User> findByOwnerId(@Param("ownerId") Integer ownerId);
}
