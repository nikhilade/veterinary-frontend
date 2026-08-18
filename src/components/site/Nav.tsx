import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, PawPrint } from "lucide-react";

const links = [
  { label: "Home", href: "#home" },
  { label: "About Us", href: "#about" },
  { label: "Modules", href: "#services" },
  { label: "Blog", href: "#blog" },
];

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="relative z-20">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <a href="#home" className="flex items-center gap-2 text-2xl font-bold text-forest">
          PawCareOS<PawPrint className="inline size-5 -rotate-12 text-clay ml-1" />
        </a>

        <nav className="hidden items-center gap-10 md:flex">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-[15px] font-medium text-forest/85 transition-colors hover:text-clay"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/pricing"
            className="text-[15px] font-medium text-forest/85 transition-colors hover:text-clay"
          >
            Pricing
          </Link>
          <Link
            to="/login"
            className="rounded-full border border-forest px-6 py-3 text-[15px] font-medium text-forest transition-colors hover:bg-forest hover:text-primary-foreground"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="rounded-full bg-forest px-6 py-3 text-[15px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Start free trial
          </Link>
        </div>

        <button
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="rounded-full border border-forest p-2 text-forest md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="mx-6 mb-4 rounded-3xl bg-card p-6 shadow-lg md:hidden">
          <nav className="flex flex-col gap-4">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="font-medium text-forest"
              >
                {l.label}
              </a>
            ))}
            <Link to="/pricing" onClick={() => setOpen(false)} className="font-medium text-forest">
              Pricing
            </Link>
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full border border-forest px-6 py-3 text-center font-medium text-forest"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              onClick={() => setOpen(false)}
              className="rounded-full bg-forest px-6 py-3 text-center font-medium text-primary-foreground"
            >
              Start free trial
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
