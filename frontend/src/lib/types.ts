export type Movie = {
  movieId: number | string;
  movieName: string;
  movieImageUrl?: string;
  movieTrailerUrl?: string;
  description?: string;
  directorName?: string;
  duration?: number;
  categoryName?: string;
  releaseDate?: string;
  sourceUrl?: string;
  tagline?: string;
  backdropUrl?: string;
  voteAverage?: number;
  imdbId?: string;
  genreLabel?: string;
  isDisplay?: boolean;
};

export type CityByMovie = {
  cityName: string;
  saloon: Array<{
    saloonId: number | string;
    saloonName: string;
  }>;
};

export type SaloonTime = {
  id: number;
  movieBeginTime: string;
  seatRows?: number;
  seatCols?: number;
  pricePerSeatPaise?: number;
};

export type Category = {
  categoryId: number;
  categoryName: string;
};

export type Director = {
  directorId: number;
  directorName: string;
};

export type LoginResponse = {
  userId: string;
  email: string;
  fullName: string;
  phone?: string;
  token: string;
  roles: string[];
};

export type RegisterPayload = {
  customerName: string;
  email: string;
  phone: string;
  password: string;
};
