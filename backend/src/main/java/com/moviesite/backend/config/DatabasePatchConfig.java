package com.moviesite.backend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
@RequiredArgsConstructor
public class DatabasePatchConfig {
    private final JdbcTemplate jdbcTemplate;

    @Bean
    CommandLineRunner ensureMovieSaloonTimeColumns() {
        return args -> {
            jdbcTemplate.execute("ALTER TABLE movie_saloon_times ADD COLUMN IF NOT EXISTS seat_rows INTEGER");
            jdbcTemplate.execute("ALTER TABLE movie_saloon_times ADD COLUMN IF NOT EXISTS seat_cols INTEGER");
            jdbcTemplate.execute("ALTER TABLE movie_saloon_times ADD COLUMN IF NOT EXISTS price_per_seat_paise INTEGER");

            jdbcTemplate.execute("UPDATE movie_saloon_times SET seat_rows = 6 WHERE seat_rows IS NULL");
            jdbcTemplate.execute("UPDATE movie_saloon_times SET seat_cols = 12 WHERE seat_cols IS NULL");
            jdbcTemplate.execute("UPDATE movie_saloon_times SET price_per_seat_paise = 19900 WHERE price_per_seat_paise IS NULL");
        };
    }
}
