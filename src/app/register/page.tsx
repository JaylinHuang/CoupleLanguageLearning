import Link from "next/link";
import { RegisterCoupleForm } from "@/components/register-couple-form";

export default function RegisterPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="card w-full max-w-2xl p-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-warm-brown">
            Register as a couple
          </h1>
          <p className="mt-2 text-sm text-warm-gray">
            Create two accounts at once — one tutor, one learner. Both emails must
            be verified before learning unlocks.
          </p>
        </div>
        <RegisterCoupleForm />
        <p className="mt-6 text-center text-sm text-warm-gray">
          Already registered?{" "}
          <Link href="/login" className="text-china-red underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
