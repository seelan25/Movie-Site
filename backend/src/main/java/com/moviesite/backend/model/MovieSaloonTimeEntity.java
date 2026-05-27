package com.moviesite.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "movie_saloon_times")
@Getter
@Setter
public class MovieSaloonTimeEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String movieBeginTime;

    @Column(nullable = false)
    private Integer seatRows = 6;

    @Column(nullable = false)
    private Integer seatCols = 12;

    @Column(nullable = false)
    private Integer pricePerSeatPaise = 19900;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "movie_id")
    private MovieEntity movie;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "saloon_id")
    private SaloonEntity saloon;
}
