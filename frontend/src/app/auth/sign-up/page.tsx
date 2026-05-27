"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiErrorMessage, apiFetch } from "@/lib/api";

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const normalizedPhoneNumber = phoneNumber.trim().replace(/[^\d+]/g, "");
      await apiFetch("/api/user/users/add", {
        method: "POST",
        json: {
          customerName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: normalizedPhoneNumber,
          password,
        },
        auth: false,
      });
      router.push("/auth/sign-in?registered=1");
      router.refresh();
    } catch (err: unknown) {
      setError(
        apiErrorMessage(err, "Could not create account. Try a different email.")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mx-auto max-w-md rounded-2xl border border-cv-border bg-cv-elev p-6">
        <h1 className="text-2xl font-semibold text-cv-text">Sign up</h1>
        <p className="mt-2 text-sm text-cv-muted">
          Uses <code className="text-cv-accent">POST /api/user/users/add</code>{" "}
          on the API gateway.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <div>
            <label className="text-sm font-semibold text-cv-text">
              Full name
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              className="mt-2 w-full rounded-xl border border-cv-border bg-cv-deep px-4 py-3 text-cv-text"
              placeholder="Your name"
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-cv-text">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              className="mt-2 w-full rounded-xl border border-cv-border bg-cv-deep px-4 py-3 text-cv-text"
              placeholder="you@email.com"
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-cv-text">
              Phone number
            </label>
            <input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="mt-2 w-full rounded-xl border border-cv-border bg-cv-deep px-4 py-3 text-cv-text"
              placeholder="+91 98765 43210"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              minLength={7}
              maxLength={20}
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-cv-text">
              Password
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
              minLength={6}
              className="mt-2 w-full rounded-xl border border-cv-border bg-cv-deep px-4 py-3 text-cv-text"
              placeholder="••••••••"
              required
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-cv-border bg-black/20 p-3 text-sm text-cv-danger">
              {error}
            </div>
          ) : null}

          <button
            disabled={loading}
            type="submit"
            className="w-full rounded-2xl bg-cv-accent py-3 font-semibold text-black hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-sm text-cv-muted">
          Already have an account?{" "}
          <Link href="/auth/sign-in" className="text-cv-accent font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
