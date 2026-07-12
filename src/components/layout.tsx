import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import type { SessionUser } from "@/lib/constants";

const learnerNav = [
  { href: "/", label: "Home", tagalog: "Home" },
  { href: "/learn", label: "Learn", tagalog: "Matuto" },
  { href: "/review", label: "Review", tagalog: "Review" },
  { href: "/listening", label: "Listen", tagalog: "Makinig" },
  { href: "/speaking", label: "Speak", tagalog: "Magsalita" },
  { href: "/typing", label: "Type", tagalog: "I-type" },
  { href: "/practice/ai", label: "Chat", tagalog: "Chat" },
  { href: "/people", label: "Lin", tagalog: "Si Lin" },
  { href: "/vocabulary", label: "Words", tagalog: "Salita" },
  { href: "/culture", label: "Culture", tagalog: "Kultura" },
  { href: "/homework", label: "Homework", tagalog: "Takdang-aralin" },
  { href: "/profile", label: "Profile", tagalog: "Profile" },
];

export function SiteHeader({
  user,
  admin = false,
}: {
  user: SessionUser;
  admin?: boolean;
}) {
  const nav = admin
    ? [
        { href: "/admin", label: "Dashboard" },
        { href: "/admin/lessons", label: "Lessons" },
        { href: "/admin/vocabulary", label: "Vocabulary" },
        { href: "/admin/homework", label: "Homework" },
        { href: "/admin/progress", label: "Progress" },
      ]
    : learnerNav;

  const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "Jaylin_love_Erika";

  return (
    <header className="sticky top-0 z-50 border-b border-blush/60 bg-cream/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href={admin ? "/admin" : "/"} className="min-w-0">
          <p className="truncate text-sm font-semibold text-coral-dark">
            {siteName}
          </p>
          <p className="truncate text-xs text-warm-gray">
            {admin ? "Admin · Lin" : `Hi, ${user.displayName}`}
          </p>
        </Link>
        <form action={logoutAction}>
          <button type="submit" className="btn-secondary text-xs">
            Log out
          </button>
        </form>
      </div>
      <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-3">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-warm-brown transition hover:bg-blush/60"
          >
            {item.label}
            {"tagalog" in item && item.tagalog ? (
              <span className="ml-1 text-xs text-warm-gray">
                / {item.tagalog}
              </span>
            ) : null}
          </Link>
        ))}
      </nav>
    </header>
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
    <main className="mx-auto max-w-5xl px-4 py-6">
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
