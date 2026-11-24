import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";
import { SiteNav } from "@/components/SiteNav";
import { getCurrentUser } from "@/lib/user-auth";

export const metadata: Metadata = {
  title: { default: "YouSee — Human-Centered Urban Intelligence", template: "%s · YouSee" },
  description:
    "YouSee connects lived experiences, places and public evidence so cities can learn from their people. Pilot: Bandar Lampung. Flagship: SheLens.",
};
export const viewport: Viewport = { themeColor: "#26384A", width: "device-width", initialScale: 1 };

const FOOTER = [
  { href: "/about", label: "About YouSee" },
  { href: "/shelens", label: "About SheLens" },
  { href: "/methodology", label: "Methodology" },
  { href: "/data", label: "Data & Sources" },
  { href: "/guidelines", label: "Community Guidelines" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/updates", label: "Updates & articles" },
  { href: "/recognition", label: "Recognition board" },
  { href: "/login", label: "Log in or join" },
  { href: "/me", label: "My contributions" },
  { href: "/admin", label: "Admin & moderation" },
];

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="en">
      <body className="min-h-screen bg-ivory text-ink antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[2000] focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-white">
          Skip to content
        </a>
        <SiteNav user={user ? { displayName: user.displayName } : null} />
        <main id="main">{children}</main>
        <footer className="mt-20 border-t border-ink/10 bg-ink text-softwhite">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-3">
            <div>
              <p className="font-display text-2xl font-bold">
                You<span className="text-rose">See</span>
              </p>
              <p className="mt-2 max-w-sm text-sm text-softwhite/70">
                Human-centered urban intelligence. Pilot city: Bandar Lampung, Indonesia. An MVP research prototype —
                contributions are not forwarded to government.
              </p>
            </div>
            <nav className="grid grid-cols-2 gap-2 text-sm md:col-span-2" aria-label="Footer">
              {FOOTER.map((f) => (
                <Link key={f.href} href={f.href} className="text-softwhite/80 hover:text-butter">
                  {f.label}
                </Link>
              ))}
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
