"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { apiErrorMessage, apiFetch } from "@/lib/api";
import { setStoredUser } from "@/lib/auth";
import type { LoginResponse } from "@/lib/types";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await apiFetch<LoginResponse>("/api/user/auth/login", {
        method: "POST",
        json: { email: email.trim().toLowerCase(), password },
        auth: false,
      });
      setStoredUser(user);
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      setError(apiErrorMessage(err, "Invalid email or password."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-cv-border bg-cv-elev p-6">
      <h1 className="text-2xl font-semibold text-cv-text">Sign in</h1>
      <p className="mt-2 text-sm text-cv-muted">
        Uses <code className="text-cv-accent">POST /api/user/auth/login</code> on
        the API gateway.
      </p>

      {registered ? (
        <div className="mt-4 rounded-xl border border-cv-accent/30 bg-[rgba(244,185,66,0.08)] p-3 text-sm text-cv-text">
          Account created. Sign in with your email and password.
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="mt-6 space-y-3">
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
          <label className="text-sm font-semibold text-cv-text">Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
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
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="mt-5 text-sm text-cv-muted">
        New here?{" "}
        <Link href="/auth/sign-up" className="text-cv-accent font-semibold">
          Create an account
        </Link>
      </p>
    </div>
  );
}
