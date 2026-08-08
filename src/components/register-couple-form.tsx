"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registerCoupleAction } from "@/app/actions/auth";

const ERRORS: Record<string, string> = {
  missing_fields: "Please fill in all fields.",
  same_email: "Tutor and learner must use different emails.",
  weak_password: "Passwords must be at least 8 characters.",
  email_taken: "One of the emails is already registered.",
  create_failed: "Could not create accounts. Try again.",
};

export function RegisterCoupleForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mt-6 space-y-6"
      action={(fd) => {
        startTransition(async () => {
          setError(null);
          const res = await registerCoupleAction(fd);
          if (!res.ok) {
            setError(ERRORS[res.error] ?? res.error);
            return;
          }
          router.push("/register/pending");
        });
      }}
    >
      {error ? (
        <div className="rounded-xl border border-china-red/30 bg-blush p-3 text-sm text-china-red">
          {error}
        </div>
      ) : null}

      <label className="block text-sm">
        <span className="text-warm-gray">Couple display name</span>
        <input
          name="coupleName"
          required
          className="mt-1 w-full rounded-xl border border-warm-gray/30 px-3 py-2"
          placeholder="Alex ♥ Sam"
        />
      </label>

      <div className="grid gap-6 md:grid-cols-2">
        <fieldset className="space-y-3 rounded-xl border border-warm-gray/20 p-4">
          <legend className="px-1 text-sm font-medium text-warm-brown">
            Tutor
          </legend>
          <input
            name="tutorDisplayName"
            required
            placeholder="Display name"
            className="w-full rounded-xl border border-warm-gray/30 px-3 py-2 text-sm"
          />
          <input
            name="tutorEmail"
            type="email"
            required
            placeholder="Email"
            className="w-full rounded-xl border border-warm-gray/30 px-3 py-2 text-sm"
          />
          <input
            name="tutorPassword"
            type="password"
            required
            minLength={8}
            placeholder="Password (min 8)"
            className="w-full rounded-xl border border-warm-gray/30 px-3 py-2 text-sm"
          />
        </fieldset>

        <fieldset className="space-y-3 rounded-xl border border-warm-gray/20 p-4">
          <legend className="px-1 text-sm font-medium text-warm-brown">
            Learner
          </legend>
          <input
            name="learnerDisplayName"
            required
            placeholder="Display name"
            className="w-full rounded-xl border border-warm-gray/30 px-3 py-2 text-sm"
          />
          <input
            name="learnerEmail"
            type="email"
            required
            placeholder="Email"
            className="w-full rounded-xl border border-warm-gray/30 px-3 py-2 text-sm"
          />
          <input
            name="learnerPassword"
            type="password"
            required
            minLength={8}
            placeholder="Password (min 8)"
            className="w-full rounded-xl border border-warm-gray/30 px-3 py-2 text-sm"
          />
        </fieldset>
      </div>

      <p className="text-xs text-warm-gray">
        Both people must verify their email before the couple becomes ACTIVE.
        Verification links are printed in the server log in development.
      </p>

      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? "Creating…" : "Create couple accounts"}
      </button>
    </form>
  );
}
