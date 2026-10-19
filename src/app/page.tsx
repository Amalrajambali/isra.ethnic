import { Hero } from "@/components/Hero";
import { CatalogGrid } from "@/components/CatalogGrid";
import { DrapeTool } from "@/components/DrapeTool";
import { PatternAnalysis } from "@/components/PatternAnalysis";
import { InstagramPhotos, InstagramReels } from "@/components/InstagramFeed";
import { BoutiqueLocator } from "@/components/BoutiqueLocator";
import { ContactButtons } from "@/components/ContactButtons";
import { Instagram, Facebook } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground pt-20">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-md border-b border-border/30">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="font-headline text-2xl tracking-tighter text-primary font-bold">
            ISRA <span className="text-foreground font-light">ETHNIC</span>
          </div>
          <div className="hidden md:flex gap-10 text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground">
            <a href="#catalog" className="hover:text-primary transition-colors">Catalog</a>
            <a href="#styling" className="hover:text-primary transition-colors">AI Stylist</a>
            <a href="#social" className="hover:text-primary transition-colors">Social</a>
            <a href="#location" className="hover:text-primary transition-colors">Contact</a>
          </div>
        </div>
      </nav>

      <Hero />

      <div className="container mx-auto px-4 sm:px-6">
        <section id="catalog" className="py-12 sm:py-24 space-y-8 sm:space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="font-headline text-3xl sm:text-4xl md:text-5xl text-foreground">The Signature Series</h2>
            <div className="h-1 w-20 bg-primary mx-auto" />
            <p className="text-muted-foreground text-base sm:text-lg italic font-light">
              Handpicked pieces that blend heritage with modern sophistication.
            </p>
          </div>
          <CatalogGrid />
        </section>

        <InstagramPhotos id="collection" />

        <section id="styling" className="py-12 sm:py-24 bg-accent/10 -mx-4 sm:-mx-6 px-4 sm:px-6">
          <div className="container mx-auto">
            <div className="text-center mb-8 sm:mb-16 space-y-4">
              <h2 className="font-headline text-3xl sm:text-4xl text-foreground">Intelligent Styling</h2>
              <p className="text-muted-foreground max-w-lg mx-auto text-base sm:text-base">
                Let our AI consultant help you find the perfect drape and accessories for any occasion.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
              <DrapeTool />
              <PatternAnalysis />
            </div>
          </div>
        </section>

        <section id="social" className="py-12 sm:py-24">
          <InstagramReels />
        </section>

        <section id="location" className="py-12 sm:py-24">
          <BoutiqueLocator />
        </section>
      </div>

      <footer className="border-t border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,244,233,0.9))]">
        <div className="container mx-auto px-6 py-5 md:py-6">
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] items-center gap-4 md:gap-6">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <a
                href="https://www.instagram.com/isra.ethnic?igsh=dnhtNHQ5dGlwdmcw"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-muted-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-primary/5 hover:text-primary"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://www.facebook.com/share/1BMiwAMz8d/"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-muted-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-primary/5 hover:text-primary"
              >
                <Facebook className="h-4 w-4" />
              </a>
            </div>

            <div className="text-center text-xs text-muted-foreground tracking-[0.2em] uppercase">
              (c) {new Date().getFullYear()} Isra Churidars & Sarees. Crafted for the elegant. Social: Isra Ethnic.
            </div>

            <div className="hidden md:block text-right text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              Tirur, Kerala
            </div>
          </div>
        </div>
      </footer>

      <ContactButtons />
    </main>
  );
}
