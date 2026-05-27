package com.moviesite.backend.config;

import com.moviesite.backend.model.MovieEntity;
import com.moviesite.backend.model.MovieSaloonTimeEntity;
import com.moviesite.backend.model.SaloonEntity;
import com.moviesite.backend.repository.MovieRepository;
import com.moviesite.backend.repository.MovieSaloonTimeRepository;
import com.moviesite.backend.repository.SaloonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDate;
import java.util.List;

@Configuration
@RequiredArgsConstructor
public class SeedDataConfig {
    private final MovieRepository movieRepository;
    private final SaloonRepository saloonRepository;
    private final MovieSaloonTimeRepository movieSaloonTimeRepository;

    @Bean
    CommandLineRunner seedData() {
        return args -> {
            if (movieRepository.count() > 0) return;

            MovieEntity interstellar = new MovieEntity();
            interstellar.setMovieName("Interstellar");
            interstellar.setDescription("A team travels through a wormhole in space in an attempt to ensure humanity's survival.");
            interstellar.setDuration(169);
            interstellar.setReleaseDate(LocalDate.of(2014, 11, 7));
            interstellar.setDisplay(true);
            interstellar.setDirectorName("Christopher Nolan");
            interstellar.setCategoryName("Sci-Fi");
            interstellar.setVoteAverage(8.6);
            interstellar.setImdbId("tt0816692");
            interstellar.setMovieImageUrl("https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg");
            interstellar.setBackdropUrl("https://image.tmdb.org/t/p/original/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg");

            MovieEntity dune2 = new MovieEntity();
            dune2.setMovieName("Dune: Part Two");
            dune2.setDescription("Paul Atreides unites with Chani and the Fremen while seeking revenge.");
            dune2.setDuration(166);
            dune2.setReleaseDate(LocalDate.of(2024, 3, 1));
            dune2.setDisplay(false);
            dune2.setDirectorName("Denis Villeneuve");
            dune2.setCategoryName("Sci-Fi");
            dune2.setVoteAverage(8.2);
            dune2.setImdbId("tt15239678");
            dune2.setMovieImageUrl("https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg");

            movieRepository.saveAll(List.of(interstellar, dune2));

            SaloonEntity pvrBengaluru = new SaloonEntity();
            pvrBengaluru.setCityName("Bengaluru");
            pvrBengaluru.setSaloonName("PVR Orion");
            SaloonEntity inoxBengaluru = new SaloonEntity();
            inoxBengaluru.setCityName("Bengaluru");
            inoxBengaluru.setSaloonName("INOX Garuda");
            SaloonEntity pvrMumbai = new SaloonEntity();
            pvrMumbai.setCityName("Mumbai");
            pvrMumbai.setSaloonName("PVR Phoenix");
            saloonRepository.saveAll(List.of(pvrBengaluru, inoxBengaluru, pvrMumbai));

            movieSaloonTimeRepository.saveAll(List.of(
                    createShow(interstellar, pvrBengaluru, "10:30"),
                    createShow(interstellar, pvrBengaluru, "14:30"),
                    createShow(interstellar, inoxBengaluru, "19:15"),
                    createShow(interstellar, pvrMumbai, "21:00"),
                    createShow(dune2, pvrMumbai, "17:30")
            ));
        };
    }

    private MovieSaloonTimeEntity createShow(MovieEntity movie, SaloonEntity saloon, String time) {
        MovieSaloonTimeEntity show = new MovieSaloonTimeEntity();
        show.setMovie(movie);
        show.setSaloon(saloon);
        show.setMovieBeginTime(time);
        return show;
    }
}
