import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { BottomNav } from "@/components/bottom-nav";
import { siteName } from "@/lib/branding";
import type { SessionUser } from "@/lib/constants";

export function SiteHeader({
  user,
  admin = false,
}: {
  user: SessionUser;
  admin?: boolean;
}) {
  const adminNav = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/lessons", label: "Lessons" },
    { href: "/admin/vocabulary", label: "Vocabulary" },
    { href: "/admin/homework", label: "Homework" },
    { href: "/admin/progress", label: "Progress" },
  ];

  const name = siteName();

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-blush/60 bg-cream/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href={admin ? "/admin" : "/"} className="min-w-0">
            <p className="truncate text-sm font-semibold text-coral-dark">
              {name}
            </p>
            <p className="truncate text-xs text-warm-gray">
              {admin ? "Tutor" : `Hi, ${user.displayName}`}
            </p>
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="btn-secondary text-xs">
              Log out
            </button>
          </form>
        </div>
        {admin ? (
          <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-3">
            {adminNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-warm-brown transition hover:bg-blush/60"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </header>
      {!admin ? <BottomNav /> : null}
    </>
  );
}

export function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    // 学习者有底栏，底部留出空间避免内容被挡住
    <main className="mx-auto max-w-5xl px-4 py-6 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-warm-brown">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-warm-gray">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </main>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="card p-4">
      <p className="text-xs uppercase tracking-wide text-warm-gray">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-coral-dark">{value}</p>
      {hint ? <p className="mt-1 text-xs text-warm-gray">{hint}</p> : null}
    </div>
  );
}
