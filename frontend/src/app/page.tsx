import Link from "next/link";
import { MovieGrid } from "@/components/MovieGrid";
import { apiErrorMessage } from "@/lib/api";
import { getBrowseMovies } from "@/lib/movies";

export const dynamic = "force-dynamic";

export default async function Home() {
  let displaying: Awaited<ReturnType<typeof getBrowseMovies>>["displaying"] = [];
  let comingSoon: Awaited<ReturnType<typeof getBrowseMovies>>["comingSoon"] = [];
  let apiError: string | null = null;

  try {
    const data = await getBrowseMovies();
    displaying = data.displaying;
    comingSoon = data.comingSoon;
  } catch (e) {
    apiError = apiErrorMessage(
      e,
      "Could not load movies from the API."
    );
  }

  return (
    <div className="bg-cv-void">
      <section className="relative overflow-hidden border-b border-cv-border">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className="text-xs tracking-[0.28em] uppercase text-cv-accent">
                Movie suggestions • search • booking
              </p>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-cv-text sm:text-5xl">
                CineVision
                <span className="mt-3 block text-xl text-cv-muted sm:text-3xl">
                  Find your next watch. Book your seat in minutes.
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-cv-muted leading-relaxed">
                Browse now playing and coming soon, search titles instantly, and
                complete checkout with Razorpay — then get your ticket details
                by email.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/search"
                  className="inline-flex items-center justify-center rounded-full bg-cv-accent px-6 py-3 font-semibold text-black hover:opacity-90"
                >
                  Search movies
                </Link>
                <a
                  href="#now-playing"
                  className="inline-flex items-center justify-center rounded-full border border-cv-border px-6 py-3 font-semibold text-cv-text hover:bg-white/5"
                >
                  Now playing
                </a>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-cv-border bg-cv-elev p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
                <p className="text-sm font-semibold text-cv-text">
                  Quick search
                </p>
                <p className="mt-1 text-sm text-cv-muted">
                  Type a title and jump to details &amp; showtimes.
                </p>
                <form action="/search" className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <input
                    name="q"
                    placeholder="Search: Top Gun, Avatar, …"
                    className="w-full rounded-xl border border-cv-border bg-cv-deep px-4 py-3 text-cv-text placeholder:text-cv-muted focus:outline-none focus:ring-2 focus:ring-[rgba(244,185,66,0.25)]"
                  />
                  <button className="rounded-xl bg-cv-accent px-4 py-3 font-semibold text-black hover:opacity-90 sm:py-0">
                    Go
                  </button>
                </form>

                <div className="mt-6 grid grid-cols-2 gap-2 text-xs text-cv-muted sm:grid-cols-3">
                  <div className="rounded-xl border border-cv-border bg-black/20 p-3">
                    <p className="text-cv-text font-semibold">
                      {displaying.length}
                    </p>
                    <p className="mt-1">Now playing</p>
                  </div>
                  <div className="rounded-xl border border-cv-border bg-black/20 p-3">
                    <p className="text-cv-text font-semibold">
                      {comingSoon.length}
                    </p>
                    <p className="mt-1">Coming soon</p>
                  </div>
                  <div className="rounded-xl border border-cv-border bg-black/20 p-3">
                    <p className="text-cv-text font-semibold">Book</p>
                    <p className="mt-1">Seat + pay</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {apiError ? (
        <section className="mx-auto max-w-6xl px-4 pt-10">
          <div className="rounded-2xl border border-cv-danger/40 bg-cv-elev p-6">
            <p className="font-semibold text-cv-danger">Backend unavailable</p>
            <p className="mt-2 text-sm text-cv-muted">{apiError}</p>
            <p className="mt-3 text-sm text-cv-muted">
              Start services in order: Eureka (8761) → user-service →
              movie-service → api-gateway (8080).
            </p>
          </div>
        </section>
      ) : null}

      <section id="now-playing" className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-semibold text-cv-text">Now playing</h2>
            <p className="mt-2 text-sm text-cv-muted">
              Movies currently in theaters — from{" "}
              <code className="text-cv-accent">/api/movie/movies/displayingMovies</code>
            </p>
          </div>
          <Link
            href="/search"
            className="text-sm font-semibold text-cv-accent hover:opacity-90"
          >
            View all →
          </Link>
        </div>
        <div className="mt-8">
          <MovieGrid
            movies={displaying}
            badge="Now"
            emptyMessage={
              apiError
                ? "Start the backend to load movies."
                : "No movies are marked as displaying yet. Add movies in the admin flow or import from TMDB."
            }
          />
        </div>
      </section>

      <section id="coming-soon" className="mx-auto max-w-6xl px-4 pb-16">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-semibold text-cv-text">Coming soon</h2>
            <p className="mt-2 text-sm text-cv-muted">
              Upcoming releases — from{" "}
              <code className="text-cv-accent">/api/movie/movies/comingSoonMovies</code>
            </p>
          </div>
        </div>
        <div className="mt-8">
          <MovieGrid
            movies={comingSoon}
            badge="Soon"
            emptyMessage="No coming-soon movies yet."
          />
        </div>
      </section>
    </div>
  );
}
