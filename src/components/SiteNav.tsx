"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/share", label: "Share" },
  { href: "/understand", label: "Understand" },
  { href: "/connect", label: "Connect" },
  { href: "/possibilities", label: "Possibilities" },
  { href: "/updates", label: "Updates" },
  { href: "/recognition", label: "Recognition" },
];

export function SiteNav({ user }: { user: { displayName: string } | null }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const active = (h: string) => (h === "/" ? path === "/" : path.startsWith(h));
  return (
    <header className="sticky top-0 z-[1000] border-b border-ink/10 bg-softwhite/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="YouSee home">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink font-display text-lg font-bold text-butter">Y</span>
          <span className="font-display text-xl font-bold text-ink">You<span className="text-rose-deep">See</span></span>
        </Link>
        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={`rounded-full px-2.5 py-2 text-[13px] font-semibold transition ${active(n.href) ? "bg-ink text-softwhite" : "text-ink hover:bg-ink/5"}`}>{n.label}</Link>
          ))}
          <Link href="/shelens" className={`ml-1 rounded-full px-3 py-2 text-[13px] font-semibold ${active("/shelens") ? "bg-rose-deep text-white" : "bg-rose text-ink hover:bg-rose/80"}`}>SheLens</Link>
          <Link href={user ? "/account" : "/login"} className="ml-1 rounded-full border border-ink/25 px-3 py-2 text-[13px] font-semibold hover:bg-ink/5">
            {user ? user.displayName.split(" ")[0] : "Log in"}
          </Link>
        </nav>
        <button className="btn-ghost !px-4 lg:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Toggle menu">{open ? "Close" : "Menu"}</button>
      </div>
      {open && (
        <nav className="border-t border-ink/10 px-4 pb-4 lg:hidden" aria-label="Mobile">
          {[...NAV, { href: "/shelens", label: "SheLens" }, { href: "/me", label: "My contributions" }, { href: user ? "/account" : "/login", label: user ? "My account" : "Log in" }].map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className={`block rounded-xl px-3 py-2.5 font-semibold ${active(n.href) ? "bg-ink text-softwhite" : "text-ink"}`}>{n.label}</Link>
          ))}
        </nav>
      )}
    </header>
  );
}
