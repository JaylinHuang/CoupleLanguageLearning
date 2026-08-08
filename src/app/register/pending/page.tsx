import Link from "next/link";

export default function RegisterPendingPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="card w-full max-w-md p-8 text-center">
        <h1 className="text-xl font-semibold text-warm-brown">
          Verify both emails
        </h1>
        <p className="mt-3 text-sm text-warm-gray">
          Your couple is pending verification. Each person must open the link
          sent to their email (in development, check the server console).
          Learning and tutoring unlock only after both sides verify.
        </p>
        <Link href="/login" className="btn-primary mt-6 inline-flex">
          Go to sign in
        </Link>
      </div>
    </div>
  );
}
