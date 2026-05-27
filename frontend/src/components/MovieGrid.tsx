import { MovieCard } from "@/components/MovieCard";
import type { Movie } from "@/lib/types";

type Props = {
  movies: Movie[];
  badge?: string;
  emptyMessage?: string;
};

export function MovieGrid({ movies, badge, emptyMessage }: Props) {
  if (movies.length === 0) {
    return (
      <p className="rounded-2xl border border-cv-border bg-cv-elev p-6 text-sm text-cv-muted">
        {emptyMessage || "No movies in this section yet."}
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {movies.map((m) => (
        <MovieCard key={String(m.movieId)} movie={m} badge={badge} />
      ))}
    </div>
  );
}
