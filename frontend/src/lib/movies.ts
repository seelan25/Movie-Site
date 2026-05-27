import { apiFetch } from "@/lib/api";
import type {
  Movie,
  CityByMovie,
  SaloonTime,
  Category,
  Director,
} from "@/lib/types";

export async function getDisplayingMovies(): Promise<Movie[]> {
  const data = await apiFetch<Movie[]>("/api/movie/movies/displayingMovies");
  return Array.isArray(data) ? data : [];
}

export async function getComingSoonMovies(): Promise<Movie[]> {
  const data = await apiFetch<Movie[]>("/api/movie/movies/comingSoonMovies");
  return Array.isArray(data) ? data : [];
}

export async function getBrowseMovies(): Promise<{
  displaying: Movie[];
  comingSoon: Movie[];
}> {
  const [displaying, comingSoon] = await Promise.all([
    getDisplayingMovies(),
    getComingSoonMovies(),
  ]);
  return { displaying, comingSoon };
}

export function dedupeMovies(movies: Movie[]): Movie[] {
  const seen = new Set<string>();
  const out: Movie[] = [];
  for (const m of movies) {
    const id = String(m.movieId);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(m);
  }
  return out;
}

export function filterMoviesByQuery(movies: Movie[], query: string): Movie[] {
  const q = query.trim().toLowerCase();
  if (!q) return movies;
  return movies.filter((m) => {
    const name = (m.movieName || "").toLowerCase();
    const genre = (m.genreLabel || m.categoryName || "").toLowerCase();
    const director = (m.directorName || "").toLowerCase();
    return name.includes(q) || genre.includes(q) || director.includes(q);
  });
}

export async function getMovieById(movieId: string): Promise<Movie> {
  return apiFetch<Movie>(`/api/movie/movies/${movieId}`);
}

export async function getCitiesByMovieId(movieId: string): Promise<CityByMovie[]> {
  return apiFetch<CityByMovie[]>(`/api/movie/cities/getCitiesByMovieId/${movieId}`);
}

export async function getSaloonTimes(saloonId: string, movieId: string): Promise<SaloonTime[]> {
  return apiFetch<SaloonTime[]>(
    `/api/movie/movieSaloonTimes/getMovieSaloonTimeSaloonAndMovieId/${saloonId}/${movieId}`
  );
}

export async function getOccupiedSeats(movieSaloonTimeId: number): Promise<string[]> {
  return apiFetch<string[]>(
    `/api/movie/bookings/occupied-seats/${movieSaloonTimeId}`
  );
}

export async function getCategories(): Promise<Category[]> {
  return apiFetch("/api/movie/categories/getall");
}

export async function getDirectors(): Promise<Director[]> {
  return apiFetch("/api/movie/directors/getall");
}
