"use client";

import Link from "next/link";
import Script from "next/script";
import { use, useEffect, useMemo, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";
import { getStoredUser, subscribeAuthChange } from "@/lib/auth";
import { env } from "@/lib/env";
import { getOccupiedSeats } from "@/lib/movies";
import type { CityByMovie, LoginResponse, Movie, SaloonTime } from "@/lib/types";

type Step = "theater" | "showtime" | "seats" | "pay";

type RazorpayHandler = () => void | Promise<void>;

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  redirect?: boolean;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: RazorpayHandler;
};

type RazorpayInstance = { open: () => void };

type CreateOrderResponse = {
  orderId?: string;
  order_id?: string;
  id?: string;
  amount: number;
  currency: string;
};

type BookingSummary = {
  bookingId: number;
  bookingCode: string;
  movieName: string;
  movieDay: string;
  movieStartTime: string;
  cityName: string;
  saloonName: string;
  seats: string;
  seatsCount: number;
  amountPaise: number;
  fullName: string;
  email: string;
  razorpayOrderId: string;
  bookedAt?: string | null;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const SEAT_ROWS = ["A", "B", "C", "D", "E", "F"] as const;
const SEAT_COLS = Array.from({ length: 12 }, (_, i) => i + 1);
const PRICE_PER_SEAT_PAISE = 19900;
const MAX_SEATS_PER_BOOKING = 8;

function seatLabel(row: string, col: number) {
  return `${row}${col}`;
}

export default function BookingPage({
  params,
}: {
  params: Promise<{ movieId: string }>;
}) {
  const { movieId } = use(params);
  const [authUser, setAuthUser] = useState<LoginResponse | null>(() => getStoredUser());
  const [step, setStep] = useState<Step>("theater");

  const [movie, setMovie] = useState<Movie | null>(null);
  const [cities, setCities] = useState<CityByMovie[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityByMovie | null>(null);
  const [selectedSaloonId, setSelectedSaloonId] = useState<string>("");
  const [saloonTimes, setSaloonTimes] = useState<SaloonTime[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SaloonTime | null>(null);
  const [occupied, setOccupied] = useState<string[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  const [fullName, setFullName] = useState(() => getStoredUser()?.fullName ?? "");
  const [email, setEmail] = useState(() => getStoredUser()?.email ?? "");
  const [phone, setPhone] = useState(() => getStoredUser()?.phone ?? "");
  const [confirmedBooking, setConfirmedBooking] = useState<BookingSummary | null>(
    null
  );

  const occupiedSet = useMemo(
    () => new Set(occupied.map((s) => s.toUpperCase())),
    [occupied]
  );
  const seatRows = useMemo(() => {
    const total = Math.max(1, Math.min(26, selectedSlot?.seatRows ?? SEAT_ROWS.length));
    return Array.from({ length: total }, (_, i) => String.fromCharCode(65 + i));
  }, [selectedSlot?.seatRows]);
  const seatCols = useMemo(() => {
    const total = Math.max(1, Math.min(30, selectedSlot?.seatCols ?? SEAT_COLS.length));
    return Array.from({ length: total }, (_, i) => i + 1);
  }, [selectedSlot?.seatCols]);
  const pricePerSeatPaise = selectedSlot?.pricePerSeatPaise ?? PRICE_PER_SEAT_PAISE;
  const isSignedIn = Boolean(authUser?.token);

  useEffect(() => {
    return subscribeAuthChange(() => setAuthUser(getStoredUser()));
  }, []);

  useEffect(() => {
    if (!authUser) return;
    setFullName(authUser.fullName || "");
    setEmail(authUser.email || "");
    setPhone(authUser.phone || "");
  }, [authUser]);

  useEffect(() => {
    apiFetch<Movie>(`/api/movie/movies/${movieId}`)
      .then(setMovie)
      .catch(() => setMovie(null));
    apiFetch<CityByMovie[]>(`/api/movie/cities/getCitiesByMovieId/${movieId}`)
      .then(setCities)
      .catch(() => setCities([]));
  }, [movieId]);

  useEffect(() => {
    if (!selectedSaloonId) return;
    apiFetch<SaloonTime[]>(
      `/api/movie/movieSaloonTimes/getMovieSaloonTimeSaloonAndMovieId/${selectedSaloonId}/${movieId}`
    )
      .then(setSaloonTimes)
      .catch(() => setSaloonTimes([]));
  }, [selectedSaloonId, movieId]);

  useEffect(() => {
    if (!selectedSlot?.id) {
      return;
    }
    getOccupiedSeats(selectedSlot.id)
      .then((list) => setOccupied(list))
      .catch(() => setOccupied([]));
  }, [selectedSlot?.id]);

  useEffect(() => {
    if (!selectedSlot?.id) return;
    const timer = window.setInterval(() => {
      getOccupiedSeats(selectedSlot.id).then(setOccupied).catch(() => {});
    }, 5000);
    return () => window.clearInterval(timer);
  }, [selectedSlot?.id]);

  function toggleSeat(code: string) {
    const c = code.toUpperCase();
    if (occupiedSet.has(c)) return;
    setSelectedSeats((prev) => {
      if (prev.includes(c)) return prev.filter((x) => x !== c);
      if (prev.length >= MAX_SEATS_PER_BOOKING) {
        alert(`You can book up to ${MAX_SEATS_PER_BOOKING} seats in one booking.`);
        return prev;
      }
      return [...prev, c].sort();
    });
  }

  function isStepUnlocked(target: Step): boolean {
    if (target === "theater") return true;
    if (target === "showtime") return Boolean(selectedCity);
    if (target === "seats") return Boolean(selectedSlot);
    if (target === "pay") return Boolean(selectedSlot && selectedSeats.length > 0);
    return false;
  }

  async function startPayment() {
    if (!env.razorpayKeyId) {
      alert("Missing NEXT_PUBLIC_RAZORPAY_KEY_ID in frontend-next/.env.local");
      return;
    }
    if (!movie || !selectedSlot?.id) return;
    if (!selectedCity || !selectedSaloonId) return;
    if (!isSignedIn) {
      alert("Please sign in before making a booking.");
      return;
    }
    if (!email || !fullName) {
      alert("Please fill in name and email.");
      return;
    }
    if (selectedSeats.length === 0) {
      alert("Pick at least one seat.");
      return;
    }
    const latestOccupied = await getOccupiedSeats(selectedSlot.id).catch(() => []);
    const latestOccupiedSet = new Set(latestOccupied.map((s) => s.toUpperCase()));
    const conflicts = selectedSeats.filter((s) => latestOccupiedSet.has(s.toUpperCase()));
    if (conflicts.length > 0) {
      setOccupied(latestOccupied);
      setSelectedSeats((prev) => prev.filter((s) => !latestOccupiedSet.has(s.toUpperCase())));
      alert(`Seat already booked: ${conflicts.join(", ")}. Please choose another seat.`);
      setStep("seats");
      return;
    }

    const amountInPaise = selectedSeats.length * pricePerSeatPaise;

    const order = await apiFetch<CreateOrderResponse>("/api/movie/payments/createOrder", {
      method: "POST",
      json: {
        amount: amountInPaise,
        currency: "INR",
        receipt: `cv_${movieId}_${Date.now()}`,
      },
    });
    const resolvedOrderId = order.orderId || order.order_id || order.id;
    if (!resolvedOrderId) {
      alert("Payment order could not be created. Please try again.");
      return;
    }

    const RazorpayCtor = window.Razorpay;
    if (!RazorpayCtor) {
      alert("Razorpay checkout script not loaded yet. Please try again.");
      return;
    }

    const saloonName =
      selectedCity.saloon?.find((s) => String(s.saloonId) === selectedSaloonId)
        ?.saloonName || "";

    const rzp = new RazorpayCtor({
      key: env.razorpayKeyId,
      amount: order.amount,
      currency: order.currency,
      name: "CineVision",
      description: `${movie.movieName} tickets`,
      order_id: resolvedOrderId,
      redirect: false,
      prefill: { name: fullName, email, contact: phone },
      theme: { color: "#f4b942" },
      handler: async function () {
        try {
          const summary = await apiFetch<BookingSummary>(
            "/api/movie/payments/sendTicketDetail",
            {
            method: "POST",
            json: {
              fullName,
              email,
              phone,
              movieName: movie.movieName,
              movieDay: new Date().toISOString().slice(0, 10),
              movieStartTime: selectedSlot.movieBeginTime,
              saloonName,
              chairNumbers: selectedSeats.join(", "),
              movieSaloonTimeId: selectedSlot.id,
              razorpayOrderId: resolvedOrderId,
              amountPaise: amountInPaise,
            },
          }
          );
          setConfirmedBooking(summary);
          setSelectedSeats([]);
          setStep("pay");
        } catch (e) {
          if (e instanceof ApiError && e.status === 409) {
            const msg =
              typeof e.body === "object" &&
              e.body &&
              "message" in e.body &&
              typeof (e.body as { message: string }).message === "string"
                ? (e.body as { message: string }).message
                : "Seat conflict — someone else booked these seats.";
            alert(msg);
            if (selectedSlot?.id) {
              getOccupiedSeats(selectedSlot.id).then(setOccupied).catch(() => {});
            }
            return;
          }
          alert("Could not finalize booking. Please contact support.");
        }
      },
    });

    rzp.open();
  }

  const steps: Step[] = ["theater", "showtime", "seats", "pay"];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs tracking-[0.28em] uppercase text-cv-accent">
            Booking
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-cv-text">
            {movie?.movieName || "Choose tickets"}
          </h1>
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
          {steps.map((s, i) => (
            <button
              key={s}
              type="button"
              disabled={!isStepUnlocked(s)}
              className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold sm:text-sm ${
                step === s
                  ? "border-cv-accent bg-[rgba(244,185,66,0.12)] text-cv-text"
                  : isStepUnlocked(s)
                    ? "border-cv-border text-cv-muted hover:bg-white/5 hover:text-cv-text"
                    : "cursor-not-allowed border-cv-border text-cv-muted/50"
              }`}
              onClick={() => {
                if (!isStepUnlocked(s)) return;
                setStep(s);
              }}
            >
              {i + 1}.{" "}
              {s === "theater"
                ? "Theater"
                : s === "showtime"
                  ? "Showtime"
                  : s === "seats"
                    ? "Seats"
                    : "Pay"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 rounded-2xl border border-cv-border bg-cv-elev p-4 sm:p-6">
          {confirmedBooking ? (
            <div className="mb-6 rounded-2xl border border-cv-accent/40 bg-[rgba(244,185,66,0.08)] p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-cv-accent">
                Booking Confirmed
              </p>
              <p className="mt-2 text-lg font-semibold text-cv-text">
                {confirmedBooking.movieName}
              </p>
              <p className="mt-1 text-sm text-cv-muted">
                Ticket Code:{" "}
                <span className="font-semibold text-cv-text">
                  {confirmedBooking.bookingCode}
                </span>
              </p>
              <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <p className="text-cv-muted">
                  Date: <span className="text-cv-text">{confirmedBooking.movieDay}</span>
                </p>
                <p className="text-cv-muted">
                  Time:{" "}
                  <span className="text-cv-text">
                    {confirmedBooking.movieStartTime}
                  </span>
                </p>
                <p className="text-cv-muted">
                  City:{" "}
                  <span className="text-cv-text">
                    {confirmedBooking.cityName || "—"}
                  </span>
                </p>
                <p className="text-cv-muted">
                  Theater:{" "}
                  <span className="text-cv-text">{confirmedBooking.saloonName}</span>
                </p>
                <p className="text-cv-muted sm:col-span-2">
                  Seats: <span className="text-cv-text">{confirmedBooking.seats}</span>
                </p>
              </div>
            </div>
          ) : null}

          {step === "theater" ? (
            <div>
              <h2 className="text-lg font-semibold text-cv-text">
                Choose city &amp; theater
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {cities.map((c) => (
                  <button
                    key={c.cityName}
                    type="button"
                    className={`rounded-2xl border p-4 text-left ${
                      selectedCity?.cityName === c.cityName
                        ? "border-cv-accent bg-[rgba(244,185,66,0.10)]"
                        : "border-cv-border hover:bg-white/5"
                    }`}
                    onClick={() => {
                      setSelectedCity(c);
                      setSelectedSaloonId("");
                      setSaloonTimes([]);
                      setSelectedSlot(null);
                      setOccupied([]);
                      setSelectedSeats([]);
                      setConfirmedBooking(null);
                      setStep("showtime");
                    }}
                  >
                    <p className="font-semibold text-cv-text">{c.cityName}</p>
                    <p className="mt-1 text-sm text-cv-muted">
                      {c.saloon?.length || 0} theaters
                    </p>
                  </button>
                ))}
              </div>
              {cities.length === 0 ? (
                <p className="mt-4 text-sm text-cv-muted">
                  No theaters found. Add cities / saloons for this movie in the backend.
                </p>
              ) : null}
            </div>
          ) : step === "showtime" ? (
            <div>
              <h2 className="text-lg font-semibold text-cv-text">Choose showtime</h2>

              <div className="mt-4">
                <label className="text-sm font-semibold text-cv-text">Theater</label>
                <select
                  className="mt-2 w-full rounded-xl border border-cv-border bg-cv-deep px-4 py-3 text-cv-text"
                  value={selectedSaloonId}
                  onChange={(e) => {
                    setSelectedSaloonId(e.target.value);
                    setSaloonTimes([]);
                    setSelectedSlot(null);
                    setOccupied([]);
                    setSelectedSeats([]);
                    setConfirmedBooking(null);
                  }}
                >
                  <option value="">Select a theater</option>
                  {selectedCity?.saloon?.map((s) => (
                    <option key={String(s.saloonId)} value={String(s.saloonId)}>
                      {s.saloonName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {saloonTimes.map((t) => (
                  <button
                    key={`${t.id}-${t.movieBeginTime}`}
                    type="button"
                    className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                      selectedSlot?.id === t.id
                        ? "border-cv-accent bg-[rgba(244,185,66,0.12)] text-cv-text"
                        : "border-cv-border text-cv-muted hover:bg-white/5 hover:text-cv-text"
                    }`}
                    onClick={() => {
                      setSelectedSlot(t);
                      setOccupied([]);
                      setSelectedSeats([]);
                      setConfirmedBooking(null);
                      setStep("seats");
                    }}
                  >
                    {t.movieBeginTime}
                  </button>
                ))}
              </div>

              {selectedSaloonId && saloonTimes.length === 0 ? (
                <p className="mt-4 text-sm text-cv-muted">
                  No showtimes found for this theater.
                </p>
              ) : null}
            </div>
          ) : step === "seats" ? (
            <div>
              <h2 className="text-lg font-semibold text-cv-text">Pick your seats</h2>
              <p className="mt-1 text-xs text-cv-muted">
                Live seat status refreshes every 5 seconds. Max {MAX_SEATS_PER_BOOKING} seats per booking.
              </p>
              <p className="mt-2 text-sm text-cv-muted">
                Screen is at the top. Grey seats are taken. You can select multiple seats.
              </p>

              {!selectedSlot ? (
                <p className="mt-6 text-sm text-cv-muted">
                  Choose a showtime first (step 2).
                </p>
              ) : (
                <>
                  <div className="mt-6 rounded-xl border border-cv-border bg-black/25 px-3 py-2 text-center text-xs font-semibold uppercase tracking-widest text-cv-muted">
                    Screen
                  </div>
                  <div className="mt-4 space-y-2 overflow-x-auto pb-2">
                    {seatRows.map((row) => (
                      <div key={row} className="flex min-w-max items-center gap-1">
                        <span className="w-6 text-center text-xs text-cv-muted">{row}</span>
                        {seatCols.map((col) => {
                          const label = seatLabel(row, col);
                          const up = label.toUpperCase();
                          const taken = occupiedSet.has(up);
                          const sel = selectedSeats.includes(up);
                          return (
                            <button
                              key={label}
                              type="button"
                              disabled={taken}
                              onClick={() => toggleSeat(label)}
                              className={`h-8 w-8 rounded-md text-[11px] font-semibold transition ${
                                taken
                                  ? "cursor-not-allowed bg-cv-deep text-cv-muted opacity-40"
                                  : sel
                                    ? "bg-cv-accent text-black"
                                    : "border border-cv-border bg-cv-deep text-cv-text hover:border-cv-accent"
                              }`}
                            >
                              {col}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  {selectedSeats.length > 0 ? (
                    <div className="mt-4 rounded-xl border border-cv-border bg-black/20 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-cv-muted">Selected seats</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedSeats.map((seat) => (
                          <span key={seat} className="rounded-full bg-cv-accent/20 px-3 py-1 text-xs font-semibold text-cv-text">
                            {seat}
                          </span>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedSeats([])}
                        className="mt-3 text-xs font-semibold text-cv-accent hover:opacity-90"
                      >
                        Clear all
                      </button>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    className="mt-6 rounded-2xl bg-cv-accent px-6 py-3 font-semibold text-black hover:opacity-90 disabled:opacity-40"
                    disabled={selectedSeats.length === 0}
                    onClick={() => setStep("pay")}
                  >
                    Continue to payment
                  </button>
                </>
              )}
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-semibold text-cv-text">Passenger details</h2>
              {!isSignedIn ? (
                <div className="mt-3 rounded-xl border border-cv-border bg-black/25 p-3 text-sm text-cv-danger">
                  Please{" "}
                  <Link href="/auth/sign-in" className="font-semibold text-cv-accent">
                    sign in
                  </Link>{" "}
                  to continue booking.
                </div>
              ) : null}

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-cv-text">Full name</label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-cv-border bg-cv-deep px-4 py-3 text-cv-text"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-cv-text">Email</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-cv-border bg-cv-deep px-4 py-3 text-cv-text"
                    placeholder="you@email.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-cv-text">Contact number</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-cv-border bg-cv-deep px-4 py-3 text-cv-text"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={startPayment}
                className="mt-6 w-full rounded-2xl bg-cv-accent py-3 font-semibold text-black hover:opacity-90 disabled:opacity-50"
                disabled={
                  !selectedCity ||
                  !selectedSaloonId ||
                  !selectedSlot ||
                  selectedSeats.length === 0 ||
                  !isSignedIn
                }
              >
                Pay with Razorpay
              </button>
            </div>
          )}
        </div>

        <aside className="order-first rounded-2xl border border-cv-border bg-cv-elev p-4 sm:p-6 lg:order-none lg:col-span-5">
          <p className="font-semibold text-cv-text">
            {confirmedBooking ? "Booking summary" : "Summary"}
          </p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-start justify-between gap-3 text-cv-muted">
              <span>Movie</span>
              <span className="text-right text-cv-text break-words">
                {confirmedBooking?.movieName || movie?.movieName || "—"}
              </span>
            </div>
            <div className="flex items-start justify-between gap-3 text-cv-muted">
              <span>City</span>
              <span className="text-right text-cv-text break-words">
                {confirmedBooking?.cityName || selectedCity?.cityName || "—"}
              </span>
            </div>
            <div className="flex items-start justify-between gap-3 text-cv-muted">
              <span>Showtime</span>
              <span className="text-right text-cv-text break-words">
                {confirmedBooking?.movieStartTime || selectedSlot?.movieBeginTime || "—"}
              </span>
            </div>
            <div className="flex items-start justify-between gap-3 text-cv-muted">
              <span>Seats</span>
              <span className="text-right text-cv-text break-words">
                {confirmedBooking?.seats || (selectedSeats.length ? selectedSeats.join(", ") : "—")}
              </span>
            </div>
            <div className="flex items-start justify-between gap-3 text-cv-muted">
              <span>Price/seat</span>
              <span className="text-right text-cv-text">₹{(pricePerSeatPaise / 100).toFixed(0)}</span>
            </div>
            {confirmedBooking ? (
              <>
                <div className="flex items-start justify-between gap-3 text-cv-muted">
                  <span>Ticket code</span>
                  <span className="text-right text-cv-text break-words">{confirmedBooking.bookingCode}</span>
                </div>
                <div className="flex items-start justify-between gap-3 text-cv-muted">
                  <span>Passenger</span>
                  <span className="text-right text-cv-text break-words">{confirmedBooking.fullName}</span>
                </div>
              </>
            ) : null}
            <div className="pt-4 border-t border-cv-border flex justify-between">
              <span className="font-semibold text-cv-text">Total</span>
              <span className="font-semibold text-cv-text">
                ₹
                {(
                  (confirmedBooking?.amountPaise ??
                    selectedSeats.length * pricePerSeatPaise) / 100
                )}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
