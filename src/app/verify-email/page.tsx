import type { ReactNode } from "react";
import Link from "next/link";
import { verifyEmailAction } from "@/app/actions/auth";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) {
    return (
      <Shell>
        <p className="text-china-red">Missing verification token.</p>
      </Shell>
    );
  }

  const result = await verifyEmailAction(token);

  return (
    <Shell>
      {result.ok ? (
        <>
          <h1 className="text-xl font-semibold text-warm-brown">
            Email verified
          </h1>
          <p className="mt-3 text-sm text-warm-gray">
            When both tutor and learner have verified, your couple becomes
            ACTIVE and features unlock.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-xl font-semibold text-china-red">
            Verification failed
          </h1>
          <p className="mt-3 text-sm text-warm-gray">
            This link is invalid or expired.
          </p>
        </>
      )}
      <Link href="/login" className="btn-primary mt-6 inline-flex">
        Sign in
      </Link>
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="card w-full max-w-md p-8 text-center">{children}</div>
    </div>
  );
}
