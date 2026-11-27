import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | ISRA Ethnic",
  description: "How ISRA Ethnic handles information on this website and in its YouTube integration.",
};

const UPDATED = "27 November 2026";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <article className="mx-auto max-w-2xl space-y-6 text-sm leading-relaxed text-foreground/90 sm:text-base">
        <header className="space-y-2">
          <h1 className="font-headline text-3xl text-primary sm:text-4xl">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: {UPDATED}</p>
        </header>

        <p>
          This policy explains what information ISRA Ethnic (&quot;we&quot;) handles on this website and through the
          tools we use to share our products.
        </p>

        <section className="space-y-2">
          <h2 className="font-headline text-xl text-primary">Visitors to this website</h2>
          <p>
            You can browse the website without creating an account. We do not ask for or store your name, email or
            payment details. When you tap &quot;Order on WhatsApp&quot; or call us, you contact us directly through
            WhatsApp or your phone, and those services&apos; own privacy policies apply.
          </p>
          <p>
            We use privacy-friendly analytics (Vercel Analytics) that count page visits without cookies and without
            identifying you personally.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-headline text-xl text-primary">Instagram and YouTube</h2>
          <p>
            The website shows posts and reels from our own Instagram account. We also use the YouTube Data API to
            publish our own Instagram reels to our own YouTube channel as Shorts. This integration only accesses the
            ISRA Ethnic YouTube channel, which we own. It is used to upload our videos and to read our channel name.
          </p>
          <p>
            The access token Google gives us is stored securely on our server and is never shared or sold. We do not
            access, collect or store information about any other YouTube user. You can review how Google handles data
            in the{" "}
            <a href="https://policies.google.com/privacy" className="text-primary underline" target="_blank" rel="noreferrer">
              Google Privacy Policy
            </a>
            . Our use of YouTube is also subject to the{" "}
            <a href="https://www.youtube.com/t/terms" className="text-primary underline" target="_blank" rel="noreferrer">
              YouTube Terms of Service
            </a>
            . Access can be revoked at any time from{" "}
            <a
              href="https://myaccount.google.com/permissions"
              className="text-primary underline"
              target="_blank"
              rel="noreferrer"
            >
              Google account permissions
            </a>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-headline text-xl text-primary">Contact</h2>
          <p>
            For any privacy question, message or call us on WhatsApp at{" "}
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
