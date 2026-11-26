package com.example.tpoDA.repositories;

import com.example.tpoDA.entities.Auction;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AuctionRepository extends JpaRepository<Auction, Integer> {

    List<Auction> findAllByOrderByDateDescTimeDesc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT auction FROM Auction auction WHERE auction.id = :id")
    Optional<Auction> findByIdForUpdate(@Param("id") Integer id);
}
