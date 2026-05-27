package com.moviesite.backend.repository;

import com.moviesite.backend.model.BookedSeatEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookedSeatRepository extends JpaRepository<BookedSeatEntity, Long> {
    List<BookedSeatEntity> findByMovieSaloonTimeId(Integer movieSaloonTimeId);
}
