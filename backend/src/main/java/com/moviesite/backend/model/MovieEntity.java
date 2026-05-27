package com.moviesite.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "movies")
@Getter
@Setter
public class MovieEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer movieId;

    @Column(nullable = false)
    private String movieName;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Integer duration;
    private LocalDate releaseDate;
    private boolean isDisplay;
    private String movieImageUrl;
    private String movieTrailerUrl;
    private String directorName;
    private String categoryName;
    private String sourceUrl;
    private String tagline;
    private String backdropUrl;
    private Double voteAverage;
    private String imdbId;
}
