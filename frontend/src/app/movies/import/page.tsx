"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";
import { getCategories, getDirectors } from "@/lib/movies";
import type { Category, Director, LoginResponse, Movie } from "@/lib/types";

export default function ImportMoviePage() {
  const [url, setUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [directorId, setDirectorId] = useState("");
  const [isInVision, setIsInVision] = useState(true);
  const [movieImageUrl, setMovieImageUrl] = useState("");
  const [movieImageFile, setMovieImageFile] = useState<File | null>(null);
  const [cityName, setCityName] = useState("");
  const [saloonName, setSaloonName] = useState("");
  const [showTimes, setShowTimes] = useState("10:00, 14:00, 18:30");
  const [seatRows, setSeatRows] = useState("6");
  const [seatCols, setSeatCols] = useState("12");
  const [ticketPrice, setTicketPrice] = useState("199");
  const [categories, setCategories] = useState<Category[]>([]);
  const [directors, setDirectors] = useState<Director[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Movie | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
    getDirectors()
      .then(setDirectors)
      .catch(() => setDirectors([]));
  }, []);

  function getToken(): string | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("cv_user");
    if (!raw) return null;
    try {
      const u = JSON.parse(raw) as LoginResponse;
      return u.token || null;
    } catch {
      return null;
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    const token = getToken();
    if (!token) {
      setError("Sign in as an admin user first (token is stored after login).");
      return;
    }
    if (!url.trim()) {
      setError("Paste a TMDB or IMDb movie URL.");
      return;
    }
    if (!categoryId || !directorId) {
      setError("Choose category and director.");
      return;
    }
    if (!cityName.trim() || !saloonName.trim()) {
      setError("Enter city and theater.");
      return;
    }
    if (!showTimes.trim()) {
      setError("Add at least one showtime (example: 10:00, 14:00, 18:30).");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("url", url.trim());
      formData.append("categoryId", String(Number(categoryId)));
      formData.append("directorId", String(Number(directorId)));
      formData.append("isInVision", String(isInVision));
      formData.append("userAccessToken", token);
      if (movieImageUrl.trim()) formData.append("movieImageUrl", movieImageUrl.trim());
      if (movieImageFile) formData.append("imageFile", movieImageFile);
      formData.append("cityName", cityName.trim());
      formData.append("saloonName", saloonName.trim());
      formData.append("showTimes", showTimes.trim());
      formData.append("seatRows", String(Number(seatRows || 0)));
      formData.append("seatCols", String(Number(seatCols || 0)));
      formData.append(
        "pricePerSeatPaise",
        String(Math.round(Number(ticketPrice || 0) * 100))
      );

      const movie = await apiFetch<Movie>("/api/movie/movies/import-from-url", {
        method: "POST",
        formData,
      });
      setResult(movie);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(
          `Request failed (${err.status}). ${typeof err.body === "string" ? err.body : JSON.stringify(err.body)}`
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Import failed. Check API keys (TMDB_API_KEY / OMDB_API_KEY) on the movie service."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-xs tracking-[0.28em] uppercase text-cv-accent">Admin</p>
      <h1 className="mt-2 text-2xl font-semibold text-cv-text">Import movie from URL</h1>
      <p className="mt-2 text-sm text-cv-muted leading-relaxed">
        Paste a{" "}
        <span className="text-cv-text">themoviedb.org/movie/…</span> or{" "}
        <span className="text-cv-text">imdb.com/title/tt…</span> link. The Java service
        creates the movie plus theater setup (timings, seat layout, and ticket amount) in PostgreSQL.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-2xl border border-cv-border bg-cv-elev p-6">
        <div>
          <label className="text-sm font-semibold text-cv-text">Movie URL</label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="mt-2 w-full rounded-xl border border-cv-border bg-cv-deep px-4 py-3 text-sm text-cv-text"
            placeholder="https://www.themoviedb.org/movie/550-fight-club"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-cv-text">Poster / image URL (optional)</label>
          <input
            value={movieImageUrl}
            onChange={(e) => setMovieImageUrl(e.target.value)}
            className="mt-2 w-full rounded-xl border border-cv-border bg-cv-deep px-4 py-3 text-sm text-cv-text"
            placeholder="https://image.tmdb.org/t/p/w500/..."
          />
          <p className="mt-2 text-xs text-cv-muted">
            If URL poster fails, upload a file below. Uploaded file is preferred.
          </p>
        </div>
        <div>
          <label className="text-sm font-semibold text-cv-text">Upload poster file (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setMovieImageFile(e.target.files?.[0] || null)}
            className="mt-2 block w-full rounded-xl border border-cv-border bg-cv-deep px-4 py-3 text-sm text-cv-text file:mr-3 file:rounded-full file:border-0 file:bg-cv-accent file:px-3 file:py-1 file:font-semibold file:text-black"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-cv-text">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-2 w-full rounded-xl border border-cv-border bg-cv-deep px-4 py-3 text-cv-text"
              required
            >
              <option value="">Select…</option>
              {categories.map((c) => (
                <option key={c.categoryId} value={c.categoryId}>
                  {c.categoryName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-cv-text">Director (DB)</label>
            <select
              value={directorId}
              onChange={(e) => setDirectorId(e.target.value)}
              className="mt-2 w-full rounded-xl border border-cv-border bg-cv-deep px-4 py-3 text-cv-text"
              required
            >
              <option value="">Select…</option>
              {directors.map((d) => (
                <option key={d.directorId} value={d.directorId}>
                  {d.directorName}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-cv-text">City</label>
            <input
              value={cityName}
              onChange={(e) => setCityName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-cv-border bg-cv-deep px-4 py-3 text-sm text-cv-text"
              placeholder="Chennai"
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-cv-text">Theater name</label>
            <input
              value={saloonName}
              onChange={(e) => setSaloonName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-cv-border bg-cv-deep px-4 py-3 text-sm text-cv-text"
              placeholder="PVR Velachery"
              required
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold text-cv-text">Show timings (comma separated)</label>
          <input
            value={showTimes}
            onChange={(e) => setShowTimes(e.target.value)}
            className="mt-2 w-full rounded-xl border border-cv-border bg-cv-deep px-4 py-3 text-sm text-cv-text"
            placeholder="10:00, 14:00, 18:30"
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-sm font-semibold text-cv-text">Seat rows</label>
            <input
              value={seatRows}
              onChange={(e) => setSeatRows(e.target.value)}
              type="number"
              min={1}
              max={26}
              className="mt-2 w-full rounded-xl border border-cv-border bg-cv-deep px-4 py-3 text-sm text-cv-text"
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-cv-text">Seats per row</label>
            <input
              value={seatCols}
              onChange={(e) => setSeatCols(e.target.value)}
              type="number"
              min={1}
              max={30}
              className="mt-2 w-full rounded-xl border border-cv-border bg-cv-deep px-4 py-3 text-sm text-cv-text"
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-cv-text">Ticket amount (INR)</label>
            <input
              value={ticketPrice}
              onChange={(e) => setTicketPrice(e.target.value)}
              type="number"
              min={1}
              step="1"
              className="mt-2 w-full rounded-xl border border-cv-border bg-cv-deep px-4 py-3 text-sm text-cv-text"
              required
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-cv-text">
          <input
            type="checkbox"
            checked={isInVision}
            onChange={(e) => setIsInVision(e.target.checked)}
            className="rounded border-cv-border"
          />
          Show in cinema (currently displaying)
        </label>

        {error ? (
          <div className="rounded-xl border border-cv-border bg-black/25 p-3 text-sm text-cv-danger">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-cv-accent py-3 font-semibold text-black hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Importing…" : "Import movie"}
        </button>
      </form>

      {result ? (
        <div className="mt-6 rounded-2xl border border-cv-border bg-cv-elev p-6">
          <p className="font-semibold text-cv-text">Imported</p>
          <p className="mt-2 text-cv-muted">
            <span className="text-cv-text font-medium">{result.movieName}</span> · id{" "}
            {result.movieId}
          </p>
          <Link
            href={`/movies/${result.movieId}`}
            className="mt-4 inline-flex rounded-full border border-cv-accent px-5 py-2 text-sm font-semibold text-cv-accent hover:bg-white/5"
          >
            Open movie page
          </Link>
        </div>
      ) : null}

      {/* <p className="mt-8 text-sm text-cv-muted">
        <Link href="/auth/sign-in" className="text-cv-accent font-semibold">
          Sign in
        </Link>{" "}
        with an admin account so the backend can authorize this action.
      </p> */}
    </div>
  );
}
