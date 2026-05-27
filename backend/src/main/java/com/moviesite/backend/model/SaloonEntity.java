package com.moviesite.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "saloons")
@Getter
@Setter
public class SaloonEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer saloonId;

    @Column(nullable = false)
    private String saloonName;

    @Column(nullable = false)
    private String cityName;
}
