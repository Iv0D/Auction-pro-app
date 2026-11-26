package com.example.tpoDA.repositories;

import com.example.tpoDA.entities.PaymentMethod;
import com.example.tpoDA.entities.User;
import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface PaymentMethodRepository extends JpaRepository<PaymentMethod, Integer> {
    List<PaymentMethod> findByUserId(Integer userId);

    List<PaymentMethod> findByUser(User user);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT method FROM PaymentMethod method WHERE method.id = :id")
    Optional<PaymentMethod> findByIdForUpdate(@Param("id") Integer id);
}
