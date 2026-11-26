package com.example.tpoDA.repositories;

import com.example.tpoDA.entities.PasswordResetToken;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Integer> {

    Optional<PasswordResetToken> findByToken(String token);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT entry FROM PasswordResetToken entry WHERE entry.token = :token")
    Optional<PasswordResetToken> findForUpdate(@Param("token") String token);

    // Para invalidar tokens anteriores del mismo usuario antes de crear uno nuevo
    void deleteByUserId(Integer userId);
}
