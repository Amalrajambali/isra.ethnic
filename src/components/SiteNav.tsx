"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "#collection", label: "Collection" },
  { href: "#catalog", label: "Signature" },
  { href: "#styling", label: "AI Stylist" },
  { href: "#social", label: "Social" },
  { href: "#location", label: "Contact" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-md border-b border-border/30">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <a href="#" className="font-headline text-2xl tracking-tighter text-primary font-bold">
          ISRA <span className="text-foreground font-light">ETHNIC</span>
        </a>

        <div className="hidden md:flex gap-10 text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-primary transition-colors">
              {link.label}
            </a>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setOpen((isOpen) => !isOpen)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="md:hidden -mr-2 p-2 text-foreground hover:text-primary"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border/30 bg-background shadow-lg animate-fade-in">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block px-6 py-4 text-sm uppercase tracking-[0.2em] font-bold text-muted-foreground border-b border-border/20 last:border-b-0 hover:text-primary hover:bg-accent/10"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
