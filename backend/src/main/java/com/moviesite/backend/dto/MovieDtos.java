package com.moviesite.backend.dto;

import java.util.List;

public class MovieDtos {
    public record ImportFromUrlRequest(
            String url,
            Integer categoryId,
            Integer directorId,
            Boolean isInVision,
            String userAccessToken,
            String movieImageUrl,
            String cityName,
            String saloonName,
            String showTimes,
            Integer seatRows,
            Integer seatCols,
            Integer pricePerSeatPaise
    ) {}

    public record MovieResponse(
            Integer movieId,
            String movieName,
            String movieImageUrl,
            String movieTrailerUrl,
            String description,
            String directorName,
            Integer duration,
            String categoryName,
            String releaseDate,
            String sourceUrl,
            String tagline,
            String backdropUrl,
            Double voteAverage,
            String imdbId,
            String genreLabel,
            boolean isDisplay
    ) {}

    public record SaloonSummary(Integer saloonId, String saloonName) {}
    public record CityByMovieResponse(String cityName, List<SaloonSummary> saloon) {}
    public record SaloonTimeResponse(
            Integer id,
            String movieBeginTime,
            Integer seatRows,
            Integer seatCols,
            Integer pricePerSeatPaise
    ) {}
    public record CategoryResponse(Integer categoryId, String categoryName) {}
    public record DirectorResponse(Integer directorId, String directorName) {}
}
