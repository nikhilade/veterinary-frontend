import { useState } from "react";
import { Menu, X, PawPrint } from "lucide-react";

const links = [
  { label: "Home", href: "#home" },
  { label: "About Us", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Blog", href: "#blog" },
];

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="relative z-20">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <a href="#home" className="flex items-center gap-2 text-2xl font-bold text-forest">
          pet g<PawPrint className="inline size-5 -rotate-12 text-clay" />od
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

        <a
          href="#contact"
          className="hidden rounded-full border border-forest px-7 py-3 text-[15px] font-medium text-forest transition-colors hover:bg-forest hover:text-primary-foreground md:inline-block"
        >
          Contact US
        </a>

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
            <a
              href="#contact"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full border border-forest px-6 py-3 text-center font-medium text-forest"
            >
              Contact US
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
