import Link from "next/link";
import { loginAction } from "@/app/actions/auth";

export function LoginForm() {
  return (
    <form action={loginAction} className="mt-8 space-y-4">
      <div>
        <label className="text-sm font-medium text-warm-brown">
          Email or username
        </label>
        <input
          name="username"
          className="input mt-1"
          placeholder="email or username"
          autoComplete="username"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium text-warm-brown">Password</label>
        <input
          name="password"
          type="password"
          className="input mt-1"
          autoComplete="current-password"
          required
        />
      </div>
      <button type="submit" className="btn-primary w-full">
        Sign in / Mag-sign in
      </button>
      <p className="text-center text-sm text-warm-gray">
        New couple?{" "}
        <Link href="/register" className="text-china-red underline">
          Register two accounts
        </Link>
      </p>
    </form>
  );
}
