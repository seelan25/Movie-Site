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
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-cv-border bg-cv-elev transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-black/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolveMediaUrl(movie.movieImageUrl)}
          alt={movie.movieName}
          className="h-full w-full object-cover opacity-90 transition duration-300 group-hover:scale-[1.04] group-hover:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        {badge ? (
          <span className="absolute left-3 top-3 rounded-full bg-cv-accent px-2.5 py-1 text-xs font-semibold text-black">
            {badge}
          </span>
        ) : null}
        {movie.voteAverage != null && movie.voteAverage > 0 ? (
          <span className="absolute right-3 top-3 rounded-full border border-cv-border bg-cv-deep/80 px-2.5 py-1 text-xs font-semibold text-cv-text">
            {movie.voteAverage.toFixed(1)}★
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="line-clamp-2 text-lg font-semibold text-cv-text">{movie.movieName}</p>
        <p className="mt-1 text-sm text-cv-muted">
          {movie.categoryName || movie.genreLabel || "Movie"}
        </p>
        <p className="mt-2 line-clamp-2 text-sm text-cv-muted">
          {movie.description || "View details and book tickets."}
        </p>
        <p className="mt-4 inline-flex w-max rounded-full border border-cv-border px-3 py-1 text-xs font-semibold text-cv-accent">
          View details
        </p>
      </div>
    </Link>
  );
}
