package com.moviesite.backend.controller;

import com.moviesite.backend.dto.MovieDtos;
import com.moviesite.backend.model.MovieEntity;
import com.moviesite.backend.model.MovieSaloonTimeEntity;
import com.moviesite.backend.model.SaloonEntity;
import com.moviesite.backend.repository.MovieRepository;
import com.moviesite.backend.repository.MovieSaloonTimeRepository;
import com.moviesite.backend.repository.SaloonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/movie")
@RequiredArgsConstructor
public class MovieController {
    private final MovieRepository movieRepository;
    private final MovieSaloonTimeRepository movieSaloonTimeRepository;
    private final SaloonRepository saloonRepository;

    @GetMapping("/movies/displayingMovies")
    public List<MovieDtos.MovieResponse> displayingMovies() {
        return movieRepository.findByIsDisplayTrueOrderByReleaseDateDesc().stream().map(this::toMovieResponse).toList();
    }

    @GetMapping("/movies/comingSoonMovies")
    public List<MovieDtos.MovieResponse> comingSoonMovies() {
        return movieRepository.findByIsDisplayFalseOrderByReleaseDateDesc().stream().map(this::toMovieResponse).toList();
    }

    @GetMapping("/movies/{movieId}")
    public MovieDtos.MovieResponse movieById(@PathVariable("movieId") Integer movieId) {
        MovieEntity movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Movie not found"));
        return toMovieResponse(movie);
    }

    @PostMapping("/movies/import-from-url")
    public MovieDtos.MovieResponse importFromUrl(@RequestBody MovieDtos.ImportFromUrlRequest request) {
        return importFromUrlInternal(request, null);
    }

    @PostMapping(value = "/movies/import-from-url", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public MovieDtos.MovieResponse importFromUrlMultipart(
            @RequestParam("url") String url,
            @RequestParam("categoryId") Integer categoryId,
            @RequestParam("directorId") Integer directorId,
            @RequestParam(value = "isInVision", required = false) Boolean isInVision,
            @RequestParam(value = "userAccessToken", required = false) String userAccessToken,
            @RequestParam(value = "movieImageUrl", required = false) String movieImageUrl,
            @RequestParam(value = "cityName", required = false) String cityName,
            @RequestParam(value = "saloonName", required = false) String saloonName,
            @RequestParam(value = "showTimes", required = false) String showTimes,
            @RequestParam(value = "seatRows", required = false) Integer seatRows,
            @RequestParam(value = "seatCols", required = false) Integer seatCols,
            @RequestParam(value = "pricePerSeatPaise", required = false) Integer pricePerSeatPaise,
            @RequestParam(value = "imageFile", required = false) MultipartFile imageFile
    ) {
        MovieDtos.ImportFromUrlRequest request = new MovieDtos.ImportFromUrlRequest(
                url,
                categoryId,
                directorId,
                isInVision,
                userAccessToken,
                movieImageUrl,
                cityName,
                saloonName,
                showTimes,
                seatRows,
                seatCols,
                pricePerSeatPaise
        );
        String uploadedImageUrl = storeUploadedPoster(imageFile);
        return importFromUrlInternal(request, uploadedImageUrl);
    }

    private MovieDtos.MovieResponse importFromUrlInternal(MovieDtos.ImportFromUrlRequest request, String uploadedImageUrl) {
        if (request == null || request.url() == null || request.url().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Movie URL is required");
        }

        String sourceUrl = request.url().trim();
        MovieEntity movie = movieRepository.findBySourceUrlIgnoreCase(sourceUrl).orElseGet(MovieEntity::new);
        if (movie.getMovieName() == null || movie.getMovieName().isBlank()) {
            movie.setMovieName(inferMovieNameFromUrl(sourceUrl));
        }

        movie.setSourceUrl(sourceUrl);
        movie.setCategoryName(resolveCategoryName(request.categoryId()));
        movie.setDirectorName(resolveDirectorName(request.directorId()));
        movie.setDisplay(Boolean.TRUE.equals(request.isInVision()));
        if (uploadedImageUrl != null && !uploadedImageUrl.isBlank()) {
            movie.setMovieImageUrl(uploadedImageUrl);
        } else if (request.movieImageUrl() != null && !request.movieImageUrl().isBlank()) {
            movie.setMovieImageUrl(request.movieImageUrl().trim());
        }
        if (movie.getReleaseDate() == null) movie.setReleaseDate(LocalDate.now());
        if (movie.getDescription() == null || movie.getDescription().isBlank()) {
            movie.setDescription("Imported from URL. Update metadata after import.");
        }

        MovieEntity saved = movieRepository.save(movie);
        upsertShowSetup(saved, request);
        return toMovieResponse(saved);
    }

    private String storeUploadedPoster(MultipartFile imageFile) {
        if (imageFile == null || imageFile.isEmpty()) return null;
        if (imageFile.getSize() > 10L * 1024 * 1024) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image file must be <= 10 MB.");
        }

        String contentType = imageFile.getContentType() == null ? "" : imageFile.getContentType();
        if (!contentType.startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only image files are allowed.");
        }

        String ext = extensionFor(contentType, imageFile.getOriginalFilename());
        String fileName = UUID.randomUUID() + ext;
        Path uploadDir = Path.of("uploads", "movies");
        Path target = uploadDir.resolve(fileName);

        try {
            Files.createDirectories(uploadDir);
            imageFile.transferTo(target);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not store image file.");
        }
        return "/uploads/movies/" + fileName;
    }

    private String extensionFor(String contentType, String originalName) {
        if (originalName != null && originalName.contains(".")) {
            String ext = originalName.substring(originalName.lastIndexOf('.')).trim();
            if (ext.length() <= 10 && ext.matches("\\.[A-Za-z0-9]+")) {
                return ext.toLowerCase(Locale.ROOT);
            }
        }
        return switch (contentType.toLowerCase(Locale.ROOT)) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            default -> ".jpg";
        };
    }

    @GetMapping("/cities/getCitiesByMovieId/{movieId}")
    public List<MovieDtos.CityByMovieResponse> citiesByMovie(@PathVariable("movieId") Integer movieId) {
        List<MovieSaloonTimeEntity> showtimes = movieSaloonTimeRepository.findByMovieMovieId(movieId);
        Map<String, Map<Integer, String>> grouped = new LinkedHashMap<>();

        for (MovieSaloonTimeEntity s : showtimes) {
            grouped.computeIfAbsent(s.getSaloon().getCityName(), k -> new LinkedHashMap<>())
                    .put(s.getSaloon().getSaloonId(), s.getSaloon().getSaloonName());
        }

        List<MovieDtos.CityByMovieResponse> out = new ArrayList<>();
        for (Map.Entry<String, Map<Integer, String>> entry : grouped.entrySet()) {
            List<MovieDtos.SaloonSummary> saloons = entry.getValue().entrySet().stream()
                    .map(s -> new MovieDtos.SaloonSummary(s.getKey(), s.getValue()))
                    .toList();
            out.add(new MovieDtos.CityByMovieResponse(entry.getKey(), saloons));
        }
        return out;
    }

    private void upsertShowSetup(MovieEntity movie, MovieDtos.ImportFromUrlRequest request) {
        if (request == null) return;
        String cityName = normalizeText(request.cityName());
        String saloonName = normalizeText(request.saloonName());
        String showTimesRaw = normalizeText(request.showTimes());
        if (cityName == null || saloonName == null || showTimesRaw == null) return;

        SaloonEntity saloon = saloonRepository
                .findByCityNameIgnoreCaseAndSaloonNameIgnoreCase(cityName, saloonName)
                .orElseGet(() -> {
                    SaloonEntity created = new SaloonEntity();
                    created.setCityName(cityName);
                    created.setSaloonName(saloonName);
                    return saloonRepository.save(created);
                });

        int seatRows = normalizeInt(request.seatRows(), 6, 26);
        int seatCols = normalizeInt(request.seatCols(), 6, 30);
        int pricePerSeatPaise = normalizeInt(request.pricePerSeatPaise(), 500, 100000);

        Set<String> requestedTimes = Arrays.stream(showTimesRaw.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toCollection(LinkedHashSet::new));
        if (requestedTimes.isEmpty()) return;

        Set<String> existing = movieSaloonTimeRepository
                .findByMovieMovieIdAndSaloonSaloonIdOrderByMovieBeginTime(movie.getMovieId(), saloon.getSaloonId())
                .stream()
                .map(MovieSaloonTimeEntity::getMovieBeginTime)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        List<MovieSaloonTimeEntity> rows = new ArrayList<>();
        for (String showTime : requestedTimes) {
            if (existing.contains(showTime)) continue;
            MovieSaloonTimeEntity show = new MovieSaloonTimeEntity();
            show.setMovie(movie);
            show.setSaloon(saloon);
            show.setMovieBeginTime(showTime);
            show.setSeatRows(seatRows);
            show.setSeatCols(seatCols);
            show.setPricePerSeatPaise(pricePerSeatPaise);
            rows.add(show);
        }
        if (!rows.isEmpty()) {
            movieSaloonTimeRepository.saveAll(rows);
        }
    }

    private String normalizeText(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    private int normalizeInt(Integer value, int min, int max) {
        if (value == null) return min;
        return Math.max(min, Math.min(max, value));
    }

    @GetMapping("/movieSaloonTimes/getMovieSaloonTimeSaloonAndMovieId/{saloonId}/{movieId}")
    public List<MovieDtos.SaloonTimeResponse> saloonTimes(
            @PathVariable("saloonId") Integer saloonId,
            @PathVariable("movieId") Integer movieId
    ) {
        return movieSaloonTimeRepository.findByMovieMovieIdAndSaloonSaloonIdOrderByMovieBeginTime(movieId, saloonId)
                .stream()
                .map(s -> new MovieDtos.SaloonTimeResponse(
                        s.getId(),
                        s.getMovieBeginTime(),
                        s.getSeatRows(),
                        s.getSeatCols(),
                        s.getPricePerSeatPaise()
                ))
                .toList();
    }

    @GetMapping("/categories/getall")
    public List<MovieDtos.CategoryResponse> categories() {
        List<String> defaultCategories = List.of(
                "Action",
                "Adventure",
                "Animation",
                "Comedy",
                "Crime",
                "Documentary",
                "Drama",
                "Family",
                "Fantasy",
                "History",
                "Horror",
                "Music",
                "Mystery",
                "Romance",
                "Sci-Fi",
                "Thriller",
                "War",
                "Western"
        );

        LinkedHashSet<String> names = new LinkedHashSet<>(defaultCategories);
        movieRepository.findAll().stream()
                .map(MovieEntity::getCategoryName)
                .filter(Objects::nonNull)
                .filter(s -> !s.isBlank())
                .forEach(names::add);

        List<MovieDtos.CategoryResponse> out = new ArrayList<>();
        int idx = 1;
        for (String name : names) {
            out.add(new MovieDtos.CategoryResponse(idx++, name));
        }
        return out;
    }

    @GetMapping("/directors/getall")
    public List<MovieDtos.DirectorResponse> directors() {
        List<String> defaultDirectors = List.of(
                "Christopher Nolan",
                "Denis Villeneuve",
                "Steven Spielberg",
                "Martin Scorsese",
                "Quentin Tarantino",
                "James Cameron",
                "Ridley Scott",
                "David Fincher",
                "Greta Gerwig",
                "Bong Joon-ho",
                "Rajkumar Hirani",
                "S. S. Rajamouli",
                "Mani Ratnam",
                "Lokesh Kanagaraj",
                "Atlee",
                "Shankar",
                "Vetrimaaran",
                "Pa. Ranjith",
                "Karthik Subbaraj",
                "A. R. Murugadoss"
        );

        LinkedHashSet<String> names = new LinkedHashSet<>(defaultDirectors);
        movieRepository.findAll().stream()
                .map(MovieEntity::getDirectorName)
                .filter(Objects::nonNull)
                .filter(s -> !s.isBlank())
                .forEach(names::add);

        List<MovieDtos.DirectorResponse> out = new ArrayList<>();
        int idx = 1;
        for (String name : names) {
            out.add(new MovieDtos.DirectorResponse(idx++, name));
        }
        return out;
    }

    private String resolveCategoryName(Integer categoryId) {
        if (categoryId == null || categoryId < 1) return "General";
        List<MovieDtos.CategoryResponse> all = categories();
        int idx = categoryId - 1;
        if (idx >= all.size()) return "General";
        return all.get(idx).categoryName();
    }

    private String resolveDirectorName(Integer directorId) {
        if (directorId == null || directorId < 1) return "Unknown";
        List<MovieDtos.DirectorResponse> all = directors();
        int idx = directorId - 1;
        if (idx >= all.size()) return "Unknown";
        return all.get(idx).directorName();
    }

    private String inferMovieNameFromUrl(String url) {
        String[] parts = url.split("/");
        String tail = "";
        for (int i = parts.length - 1; i >= 0; i--) {
            String part = parts[i] == null ? "" : parts[i].trim();
            if (!part.isBlank()) {
                tail = part;
                break;
            }
        }

        String clean = tail.split("\\?")[0];
        if (clean.startsWith("tt") && clean.length() > 2) {
            return "IMDb " + clean.toUpperCase(Locale.ROOT);
        }

        String slug = clean.replaceAll("^\\d+-", "").replace('-', ' ').replace('_', ' ').trim();
        if (slug.isBlank()) slug = "Imported Movie";

        String finalSlug = slug;
        return Arrays.stream(finalSlug.split("\\s+"))
                .filter(s -> !s.isBlank())
                .map(this::capitalize)
                .collect(Collectors.joining(" "));
    }

    private String capitalize(String value) {
        if (value.isBlank()) return value;
        if (value.length() == 1) return value.toUpperCase(Locale.ROOT);
        return value.substring(0, 1).toUpperCase(Locale.ROOT) + value.substring(1).toLowerCase(Locale.ROOT);
    }

    private MovieDtos.MovieResponse toMovieResponse(MovieEntity m) {
        return new MovieDtos.MovieResponse(
                m.getMovieId(),
                m.getMovieName(),
                m.getMovieImageUrl(),
                m.getMovieTrailerUrl(),
                m.getDescription(),
                m.getDirectorName(),
                m.getDuration(),
                m.getCategoryName(),
                m.getReleaseDate() == null ? null : m.getReleaseDate().toString(),
                m.getSourceUrl(),
                m.getTagline(),
                m.getBackdropUrl(),
                m.getVoteAverage(),
                m.getImdbId(),
                m.getCategoryName(),
                m.isDisplay()
        );
    }
}
