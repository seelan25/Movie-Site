"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getStoredUser, subscribeAuthChange } from "@/lib/auth";
import { getBrowseMovies } from "@/lib/movies";
import type { AdminUser, BookingSummary, LoginResponse, Movie } from "@/lib/types";

export default function AdminDashboardPage() {
  const [authUser, setAuthUser] = useState<LoginResponse | null>(() => getStoredUser());
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = Boolean(authUser?.roles?.includes("ROLE_ADMIN"));
  const totalRevenuePaise = useMemo(
    () => bookings.reduce((sum, b) => sum + (b.amountPaise || 0), 0),
    [bookings]
  );

  useEffect(() => subscribeAuthChange(() => setAuthUser(getStoredUser())), []);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      apiFetch<AdminUser[]>("/api/user/admin/users"),
      getBrowseMovies().then(({ displaying, comingSoon }) => [...displaying, ...comingSoon]),
      apiFetch<BookingSummary[]>("/api/movie/bookings/completed"),
    ])
      .then(([allUsers, allMovies, allBookings]) => {
        setUsers(Array.isArray(allUsers) ? allUsers : []);
        setMovies(Array.isArray(allMovies) ? allMovies : []);
        setBookings(Array.isArray(allBookings) ? allBookings : []);
      })
      .catch(() => {
        setUsers([]);
        setMovies([]);
        setBookings([]);
      })
      .finally(() => setLoading(false));
  }, [isAdmin]);

  if (!authUser) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-2xl border border-cv-border bg-cv-elev p-6">
          <h1 className="text-2xl font-semibold text-cv-text">Admin Dashboard</h1>
          <p className="mt-3 text-sm text-cv-muted">
            Sign in with admin account to monitor users, movies, and booking data.
          </p>
          <Link
            href="/auth/sign-in"
            className="mt-5 inline-flex rounded-full bg-cv-accent px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-2xl border border-cv-border bg-cv-elev p-6">
          <h1 className="text-2xl font-semibold text-cv-text">Admin Dashboard</h1>
          <p className="mt-3 text-sm text-cv-danger">
            Access denied. This page is available only for admin login.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-xs tracking-[0.28em] uppercase text-cv-accent">Admin Monitoring</p>
      <h1 className="mt-2 text-2xl font-semibold text-cv-text">Dashboard</h1>
      <p className="mt-2 text-sm text-cv-muted">
        Monitor all users, movies, and booking details. Booking flow is disabled for admin.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-cv-border bg-cv-elev p-4">
          <p className="text-xs uppercase tracking-wider text-cv-muted">Users</p>
          <p className="mt-1 text-2xl font-semibold text-cv-text">{users.length}</p>
        </div>
        <div className="rounded-2xl border border-cv-border bg-cv-elev p-4">
          <p className="text-xs uppercase tracking-wider text-cv-muted">Movies</p>
          <p className="mt-1 text-2xl font-semibold text-cv-text">{movies.length}</p>
        </div>
        <div className="rounded-2xl border border-cv-border bg-cv-elev p-4">
          <p className="text-xs uppercase tracking-wider text-cv-muted">Completed Bookings</p>
          <p className="mt-1 text-2xl font-semibold text-cv-text">{bookings.length}</p>
        </div>
        <div className="rounded-2xl border border-cv-border bg-cv-elev p-4">
          <p className="text-xs uppercase tracking-wider text-cv-muted">Revenue</p>
          <p className="mt-1 text-2xl font-semibold text-cv-text">₹{(totalRevenuePaise / 100).toFixed(0)}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/movies/import"
          className="rounded-full bg-cv-accent px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
        >
          Import New Movie
        </Link>
      </div>

      <section className="mt-8 rounded-2xl border border-cv-border bg-cv-elev p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-cv-text">Users</h2>
        {loading ? (
          <p className="mt-3 text-sm text-cv-muted">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="mt-3 text-sm text-cv-muted">No users found.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-cv-muted">
                <tr className="border-b border-cv-border">
                  <th className="px-3 py-2 text-left font-semibold">Name</th>
                  <th className="px-3 py-2 text-left font-semibold">Email</th>
                  <th className="px-3 py-2 text-left font-semibold">Phone</th>
                  <th className="px-3 py-2 text-left font-semibold">Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.userId || u.email} className="border-b border-cv-border/70">
                    <td className="px-3 py-2 text-cv-text">{u.fullName || "-"}</td>
                    <td className="px-3 py-2 text-cv-text">{u.email}</td>
                    <td className="px-3 py-2 text-cv-text">{u.phone || "-"}</td>
                    <td className="px-3 py-2 text-cv-text">{u.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-8 rounded-2xl border border-cv-border bg-cv-elev p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-cv-text">Movies</h2>
        {loading ? (
          <p className="mt-3 text-sm text-cv-muted">Loading movies...</p>
        ) : movies.length === 0 ? (
          <p className="mt-3 text-sm text-cv-muted">No movies found.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {movies.map((m) => (
              <div key={String(m.movieId)} className="rounded-xl border border-cv-border bg-cv-deep p-4">
                <p className="font-semibold text-cv-text">{m.movieName}</p>
                <p className="mt-1 text-xs text-cv-muted">{m.categoryName || m.genreLabel || "Unknown genre"}</p>
                <p className="mt-1 text-xs text-cv-muted">{m.directorName || "Unknown director"}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8 rounded-2xl border border-cv-border bg-cv-elev p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-cv-text">Booking Details</h2>
        {loading ? (
          <p className="mt-3 text-sm text-cv-muted">Loading bookings...</p>
        ) : bookings.length === 0 ? (
          <p className="mt-3 text-sm text-cv-muted">No completed bookings yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-cv-muted">
                <tr className="border-b border-cv-border">
                  <th className="px-3 py-2 text-left font-semibold">Movie</th>
                  <th className="px-3 py-2 text-left font-semibold">User</th>
                  <th className="px-3 py-2 text-left font-semibold">Seats</th>
                  <th className="px-3 py-2 text-left font-semibold">Show</th>
                  <th className="px-3 py-2 text-left font-semibold">Amount</th>
                  <th className="px-3 py-2 text-left font-semibold">Code</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={`${b.bookingId}-${b.razorpayOrderId}`} className="border-b border-cv-border/70">
                    <td className="px-3 py-2 text-cv-text">{b.movieName}</td>
                    <td className="px-3 py-2 text-cv-text">{b.fullName || b.email}</td>
                    <td className="px-3 py-2 text-cv-text">{b.seats}</td>
                    <td className="px-3 py-2 text-cv-text">{b.movieDay} {b.movieStartTime}</td>
                    <td className="px-3 py-2 text-cv-text">₹{(b.amountPaise / 100).toFixed(0)}</td>
                    <td className="px-3 py-2 text-cv-text">{b.bookingCode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
