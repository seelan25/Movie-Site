package com.moviesite.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(
        name = "booked_seats",
        uniqueConstraints = @UniqueConstraint(columnNames = {"movie_saloon_time_id", "seat_code"})
)
@Getter
@Setter
public class BookedSeatEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "seat_code", nullable = false, length = 8)
    private String seatCode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "booking_id")
    private BookingEntity booking;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "movie_saloon_time_id")
    private MovieSaloonTimeEntity movieSaloonTime;
}
