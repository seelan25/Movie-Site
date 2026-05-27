package com.moviesite.backend.repository;

import com.moviesite.backend.model.MovieSaloonTimeEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MovieSaloonTimeRepository extends JpaRepository<MovieSaloonTimeEntity, Integer> {
    List<MovieSaloonTimeEntity> findByMovieMovieIdAndSaloonSaloonIdOrderByMovieBeginTime(Integer movieId, Integer saloonId);
    List<MovieSaloonTimeEntity> findByMovieMovieId(Integer movieId);
}
