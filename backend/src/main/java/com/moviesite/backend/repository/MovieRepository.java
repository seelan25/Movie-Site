package com.moviesite.backend.repository;

import com.moviesite.backend.model.MovieEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MovieRepository extends JpaRepository<MovieEntity, Integer> {
    List<MovieEntity> findByIsDisplayTrueOrderByReleaseDateDesc();
    List<MovieEntity> findByIsDisplayFalseOrderByReleaseDateDesc();
    Optional<MovieEntity> findBySourceUrlIgnoreCase(String sourceUrl);
}
