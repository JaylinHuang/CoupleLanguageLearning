"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Home", tagalog: "Home", icon: "🏠" },
  { href: "/learn", label: "Learn", tagalog: "Matuto", icon: "📚" },
  { href: "/review", label: "Review", tagalog: "Review", icon: "🔁" },
  { href: "/practice", label: "Practice", tagalog: "Pagsasanay", icon: "✨" },
  { href: "/profile", label: "Profile", tagalog: "Profile", icon: "👤" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

// 学习者手机底栏：固定 5 个入口，减少顶部横向滚动找功能
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-blush/60 bg-cream/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-5xl items-stretch justify-around px-1 pt-1">
        {TABS.map((tab) => {
          const active = isActive(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-center transition ${
                active
                  ? "bg-blush/70 text-coral-dark"
                  : "text-warm-gray hover:bg-blush/40"
              }`}
            >
              <span className="text-base leading-none" aria-hidden>
                {tab.icon}
              </span>
              <span className="truncate text-[11px] font-medium leading-tight">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
