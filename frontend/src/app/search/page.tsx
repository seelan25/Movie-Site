import Link from "next/link";
import { MovieCard } from "@/components/MovieCard";
import { apiErrorMessage } from "@/lib/api";
import {
  dedupeMovies,
  filterMoviesByQuery,
  getBrowseMovies,
} from "@/lib/movies";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const qRaw = Array.isArray(params.q) ? params.q[0] : params.q;
  const q = qRaw?.trim() ?? "";

  let apiError: string | null = null;
  let results: ReturnType<typeof dedupeMovies> = [];

  try {
    const { displaying, comingSoon } = await getBrowseMovies();
    const all = dedupeMovies([...displaying, ...comingSoon]);
    results = q ? filterMoviesByQuery(all, q) : all;
  } catch (e) {
    apiError = apiErrorMessage(e, "Could not load movies.");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="cv-panel relative overflow-hidden p-5 sm:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_15%,var(--cv-accent-soft),transparent_40%)]" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
          <h1 className="text-2xl font-semibold tracking-tight text-cv-text">
            Search movies
          </h1>
          <p className="mt-2 text-sm text-cv-muted">
            Search by title, genre, or director across now playing and coming
            soon.
          </p>
        </div>

          <form action="/search" className="flex w-full flex-col gap-2 sm:w-[420px] sm:flex-row">
            <input
              name="q"
              defaultValue={qRaw ?? ""}
              placeholder="Search: Avatar, Top Gun, …"
              className="w-full rounded-xl border border-cv-border bg-cv-deep px-4 py-3 text-cv-text placeholder:text-cv-muted focus:outline-none focus:ring-2 focus:ring-cv-accent-soft"
            />
            <button className="rounded-xl bg-cv-accent px-5 py-3 font-semibold text-black hover:opacity-90 sm:py-0">
              Search
            </button>
          </form>
        </div>
      </div>

      {apiError ? (
        <div className="cv-panel mt-8 border-cv-danger/40 p-6">
          <p className="font-semibold text-cv-danger">Could not reach the API</p>
          <p className="mt-2 text-sm text-cv-muted">{apiError}</p>
        </div>
      ) : null}

      {!apiError && results.length > 0 ? (
        <p className="mt-6 text-sm text-cv-muted">
          {q
            ? `${results.length} result${results.length === 1 ? "" : "s"} for “${q}”`
            : `${results.length} movies available`}
        </p>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {results.map((m) => (
          <MovieCard key={String(m.movieId)} movie={m} />
        ))}
      </div>

      {!apiError && results.length === 0 ? (
        <div className="cv-panel mt-10 p-6">
          <p className="font-semibold text-cv-text">
            {q ? "No results" : "No movies yet"}
          </p>
          <p className="mt-2 text-sm text-cv-muted">
            {q
              ? "Try a different title, genre, or director name."
              : "Import or add movies in the backend, then refresh this page."}
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex text-sm font-semibold text-cv-accent hover:opacity-90"
          >
            Back to home →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
