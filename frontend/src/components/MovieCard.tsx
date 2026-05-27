import Link from "next/link";
import { resolveMediaUrl } from "@/lib/media";
import type { Movie } from "@/lib/types";

type Props = {
  movie: Movie;
  badge?: string;
};

export function MovieCard({ movie, badge }: Props) {
  return (
    <Link
      href={`/movies/${movie.movieId}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-cv-border bg-cv-elev hover:bg-white/5"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-black/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolveMediaUrl(movie.movieImageUrl)}
          alt={movie.movieName}
          className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100 group-hover:scale-[1.02]"
        />
        {badge ? (
          <span className="absolute left-3 top-3 rounded-full bg-cv-accent px-2.5 py-1 text-xs font-semibold text-black">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="line-clamp-2 font-semibold text-cv-text">{movie.movieName}</p>
        <p className="mt-1 text-sm text-cv-muted">
          {movie.categoryName || movie.genreLabel || "Movie"}
        </p>
        {movie.voteAverage != null && movie.voteAverage > 0 ? (
          <p className="mt-2 text-xs text-cv-accent">
            {movie.voteAverage.toFixed(1)} / 10
          </p>
        ) : null}
        <p className="mt-2 line-clamp-2 text-sm text-cv-muted">
          {movie.description || "View details and book tickets."}
        </p>
      </div>
    </Link>
  );
}
