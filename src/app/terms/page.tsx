import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | ISRA Ethnic",
  description: "Terms for using the ISRA Ethnic website.",
};

const UPDATED = "27 November 2026";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <article className="mx-auto max-w-2xl space-y-6 text-sm leading-relaxed text-foreground/90 sm:text-base">
        <header className="space-y-2">
          <h1 className="font-headline text-3xl text-primary sm:text-4xl">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: {UPDATED}</p>
        </header>

        <p>
          These terms apply to the ISRA Ethnic website (israethnic.vercel.app), run by Isra Churidars &amp; Sarees,
          Tirur, Kerala, India (&quot;we&quot;). By using the website you agree to them.
        </p>

        <section className="space-y-2">
          <h2 className="font-headline text-xl text-primary">Using the website</h2>
          <p>
            The website shows our products, photos and videos. Product names, prices and availability can change at
            any time and are confirmed when you order with us on WhatsApp or by phone. Orders, payment and delivery are
            agreed directly between you and us.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-headline text-xl text-primary">Content</h2>
          <p>
            Photos, videos, text and logos on this website belong to ISRA Ethnic. Please don&apos;t copy or reuse them
            without our permission.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-headline text-xl text-primary">YouTube</h2>
          <p>
            We use YouTube API Services to publish our own videos to our own YouTube channel. Watching our videos on
            YouTube is subject to the{" "}
            <a href="https://www.youtube.com/t/terms" className="text-primary underline" target="_blank" rel="noreferrer">
              YouTube Terms of Service
            </a>{" "}
            and the{" "}
            <a href="https://policies.google.com/privacy" className="text-primary underline" target="_blank" rel="noreferrer">
              Google Privacy Policy
            </a>
            . See our{" "}
            <Link href="/privacy" className="text-primary underline">
              Privacy Policy
            </Link>{" "}
            for how we handle data.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-headline text-xl text-primary">Liability</h2>
          <p>
            The website is provided &quot;as is&quot;. We try to keep it accurate and available but can&apos;t promise
            it will always be error-free or online. We are not responsible for third-party websites we link to, such as
            Instagram, Facebook, WhatsApp and YouTube.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-headline text-xl text-primary">Changes and contact</h2>
          <p>
            We may update these terms; the date above shows the latest version. Questions? Message or call us on
            WhatsApp at{" "}
            <a href="https://wa.me/918113081120" className="text-primary underline">
              +91 81130 81120
            </a>
            .
          </p>
        </section>

        <p>
          <Link href="/" className="font-semibold text-primary hover:underline">
            ← Back to ISRA Ethnic
          </Link>
        </p>
      </article>
    </main>
  );
}
