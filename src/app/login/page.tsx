import { LoginForm } from "@/components/login-form";
import { siteName, siteTagline } from "@/lib/branding";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const name = siteName();

  const errorMessage =
    error === "invalid"
      ? "Invalid username or password."
      : error === "missing"
        ? "Please enter username and password."
        : null;

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="card w-full max-w-md p-8">
        <div className="text-center">
          <p className="text-3xl">💕</p>
          <h1 className="mt-2 text-2xl font-semibold text-warm-brown">
            {name}
          </h1>
          <p className="mt-2 text-sm text-warm-gray">
            {siteTagline()}
          </p>
          <p className="mt-1 text-xs text-warm-gray">
            Pribadong pag-aaral ng Chinese
          </p>
        </div>
        {errorMessage ? (
          <div className="mt-4 rounded-xl border border-china-red/30 bg-blush p-3 text-center text-sm text-china-red">
            {errorMessage}
          </div>
        ) : null}
        <LoginForm />
      </div>
    </div>
  );
}
