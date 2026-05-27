package com.moviesite.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bookings")
@Getter
@Setter
public class BookingEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fullName;
    private String email;
    private String movieName;
    private String movieDay;
    private String movieStartTime;
    private String saloonName;
    private String chairNumbers;
    private String razorpayOrderId;
    private Integer amountPaise;

    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "movie_saloon_time_id")
    private MovieSaloonTimeEntity movieSaloonTime;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BookedSeatEntity> bookedSeats = new ArrayList<>();
}
