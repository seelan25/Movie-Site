import Link from "next/link";
import { getCitiesByMovieId, getMovieById } from "@/lib/movies";
import { resolveMediaUrl } from "@/lib/media";

export const dynamic = "force-dynamic";

export default async function MovieDetailPage({
  params,
}: {
  params: Promise<{ movieId: string }>;
}) {
  const { movieId } = await params;

  const [movie, cities] = await Promise.all([
    getMovieById(movieId),
    getCitiesByMovieId(movieId).catch(() => []),
  ]);

  const imdbHref =
    movie.imdbId && movie.imdbId.startsWith("tt")
      ? `https://www.imdb.com/title/${movie.imdbId}/`
      : null;

  return (
    <div className="pb-10">
      {movie.backdropUrl ? (
        <div className="relative h-[min(42vh,340px)] w-full overflow-hidden border-b border-cv-border sm:h-[min(52vh,420px)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolveMediaUrl(movie.backdropUrl)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-cv-void via-cv-void/80 to-transparent" />
          <div className="relative mx-auto flex h-full max-w-6xl items-end px-4 pb-10">
            <div>
              <p className="text-xs tracking-[0.28em] uppercase text-cv-accent">
                Now showing
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-cv-text sm:text-4xl">
                {movie.movieName}
              </h1>
              {movie.tagline ? (
                <p className="mt-2 text-sm italic text-cv-muted">{movie.tagline}</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div
        className={`mx-auto max-w-6xl px-4 ${movie.backdropUrl ? "-mt-3 py-8 sm:-mt-4 sm:py-0" : "py-8 sm:py-10"}`}
      >
        <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <div className="overflow-hidden rounded-2xl border border-cv-border bg-cv-elev shadow-2xl shadow-black/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveMediaUrl(movie.movieImageUrl)}
                alt={movie.movieName}
                className="h-[420px] w-full object-cover sm:h-[520px]"
              />
            </div>
          </div>

          <div className="lg:col-span-8">
            {!movie.backdropUrl ? (
              <>
                <p className="text-xs tracking-[0.28em] uppercase text-cv-accent">
                  Details &amp; booking
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-cv-text sm:text-4xl">
                  {movie.movieName}
                </h1>
                {movie.tagline ? (
                  <p className="mt-2 text-sm italic text-cv-muted">{movie.tagline}</p>
                ) : null}
              </>
            ) : (
              <p className="text-xs tracking-[0.28em] uppercase text-cv-muted">
                Details &amp; booking
              </p>
            )}

            <p className="mt-4 text-cv-muted leading-relaxed">
              {movie.description || "No description provided."}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {movie.voteAverage != null && movie.voteAverage > 0 ? (
                <span className="rounded-full border border-cv-border bg-black/30 px-3 py-1 text-sm text-cv-text">
                  Rating <strong className="text-cv-accent">{movie.voteAverage.toFixed(1)}</strong>
                  /10
                </span>
              ) : null}
              {movie.genreLabel ? (
                <span className="rounded-full border border-cv-border bg-black/30 px-3 py-1 text-sm text-cv-muted">
                  {movie.genreLabel}
                </span>
              ) : null}
              {imdbHref ? (
                <a
                  href={imdbHref}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-cv-border px-3 py-1 text-sm text-cv-accent hover:bg-white/5"
                >
                  IMDb
                </a>
              ) : null}
              {movie.sourceUrl ? (
                <a
                  href={movie.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-cv-border px-3 py-1 text-sm text-cv-muted hover:bg-white/5 hover:text-cv-text"
                >
                  Source link
                </a>
              ) : null}
              {movie.movieTrailerUrl ? (
                <a
                  href={movie.movieTrailerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-cv-accent/40 bg-[rgba(244,185,66,0.08)] px-3 py-1 text-sm font-semibold text-cv-accent hover:opacity-90"
                >
                  Watch trailer
                </a>
              ) : null}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-cv-border bg-cv-elev p-4">
                <p className="text-xs uppercase tracking-wider text-cv-muted">
                  Director
                </p>
                <p className="mt-1 font-semibold text-cv-text">
                  {movie.directorName || "—"}
                </p>
              </div>
              <div className="rounded-2xl border border-cv-border bg-cv-elev p-4">
                <p className="text-xs uppercase tracking-wider text-cv-muted">
                  Runtime
                </p>
                <p className="mt-1 font-semibold text-cv-text">
                  {movie.duration ? `${movie.duration} min` : "—"}
                </p>
              </div>
              <div className="rounded-2xl border border-cv-border bg-cv-elev p-4">
                <p className="text-xs uppercase tracking-wider text-cv-muted">
                  Genre
                </p>
                <p className="mt-1 font-semibold text-cv-text">
                  {movie.categoryName || "—"}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/movies/${movieId}/book`}
                className="inline-flex w-full items-center justify-center rounded-full bg-cv-accent px-7 py-3 font-semibold text-black hover:opacity-90 sm:w-auto"
              >
                Get tickets
              </Link>
              <Link
                href="/search"
                className="inline-flex w-full items-center justify-center rounded-full border border-cv-border px-7 py-3 font-semibold text-cv-text hover:bg-white/5 sm:w-auto"
              >
                Back to search
              </Link>
            </div>

            <div className="mt-10 rounded-2xl border border-cv-border bg-cv-elev p-6">
              <p className="font-semibold text-cv-text">Theaters</p>
              <p className="mt-2 text-sm text-cv-muted">
                Choose city, showtime, and seats on the booking page.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {cities.slice(0, 12).map((c) => (
                  <span
                    key={c.cityName}
                    className="rounded-full border border-cv-border bg-black/20 px-3 py-1 text-sm text-cv-muted"
                  >
                    {c.cityName}
                  </span>
                ))}
                {cities.length === 0 ? (
                  <span className="text-sm text-cv-muted">
                    No theaters linked to this movie yet.
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
