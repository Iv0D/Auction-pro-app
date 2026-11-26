package com.example.tpoDA.repositories;

import com.example.tpoDA.entities.PendingRegistration;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PendingRegistrationRepository extends JpaRepository<PendingRegistration, Integer> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT entry FROM PendingRegistration entry WHERE entry.token = :token")
    Optional<PendingRegistration> findForUpdate(@Param("token") String token);

    Optional<PendingRegistration> findByUserId(Integer userId);
}
