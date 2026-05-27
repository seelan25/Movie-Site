import { Suspense } from "react";
import { SignInForm } from "./SignInForm";

export default function SignInPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Suspense
        fallback={
          <div className="mx-auto max-w-md rounded-2xl border border-cv-border bg-cv-elev p-6 text-cv-muted">
            Loading…
          </div>
        }
      >
        <SignInForm />
      </Suspense>
    </div>
  );
}
