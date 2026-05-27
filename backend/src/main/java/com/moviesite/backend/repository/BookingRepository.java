package com.moviesite.backend.repository;

import com.moviesite.backend.model.BookingEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<BookingEntity, Long> {
    Optional<BookingEntity> findTopByRazorpayOrderIdOrderByCreatedAtDesc(String razorpayOrderId);
    List<BookingEntity> findAllByOrderByCreatedAtDesc();
}
