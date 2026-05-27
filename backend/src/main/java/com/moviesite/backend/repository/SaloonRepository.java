package com.moviesite.backend.repository;

import com.moviesite.backend.model.SaloonEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SaloonRepository extends JpaRepository<SaloonEntity, Integer> {
    Optional<SaloonEntity> findByCityNameIgnoreCaseAndSaloonNameIgnoreCase(String cityName, String saloonName);
}
