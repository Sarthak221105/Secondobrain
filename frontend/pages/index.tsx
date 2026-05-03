import { useEffect } from 'react';
import Head from 'next/head';
import LandingHeader from '../components/landing/LandingHeader';
import Hero from '../components/landing/Hero';
import CoreInsight from '../components/landing/CoreInsight';
import TheSystem from '../components/landing/TheSystem';
import TheDifference from '../components/landing/TheDifference';
import DecisionLayer from '../components/landing/DecisionLayer';
import FinalShift from '../components/landing/FinalShift';
import Waitlist from '../components/landing/Waitlist';
import WaitlistCount from '../components/landing/WaitlistCount';

/**
 * Secondo Brain marketing landing page.
 *
 * Uniform cream palette top-to-bottom — subtle bg-cream-50 / bg-cream-100
 * alternation between sections to keep things visually paced without
 * switching to a dark theme. The body gets the `landing-theme` class on
 * mount so the global cream bg matches; removed on unmount so /search and
 * /admin keep their existing gray.
 */
export default function Landing() {
  useEffect(() => {
    document.body.classList.add('landing-theme');
    return () => {
      document.body.classList.remove('landing-theme');
    };
  }, []);

  return (
    <>
      <Head>
        <title>SecondoBrain — The Company Brain for AI</title>
        <meta
          name="description"
          content="SecondoBrain builds the Company Brain — the system that structures knowledge, decisions, and workflows so AI can operate reliably."
        />
      </Head>
      <div className="min-h-screen bg-cream-50 text-ink-900">
        <LandingHeader />
        <main>
          <Hero />
          <CoreInsight />
          <TheSystem />
          <TheDifference />
          <DecisionLayer />
          <FinalShift />

          {/* Big social-proof count right before the signup form. */}
          <section className="relative py-20 bg-cream-50 text-center border-t border-black/5">
            <div className="relative max-w-3xl mx-auto px-5 sm:px-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-ink-600 font-mono">
                A quiet list is growing
              </p>
              <div className="mt-5">
                <WaitlistCountLarge />
              </div>
            </div>
          </section>

          <Waitlist />
        </main>

        <footer className="border-t border-black/10 bg-cream-50 py-10 text-center text-xs text-ink-600">
          © {new Date().getFullYear()} Secondo Brain · Testing-phase build ·
          <a
            href="/search"
            className="ml-1 underline underline-offset-4 hover:text-rust"
          >
            Skip to the demo
          </a>
        </footer>
      </div>
    </>
  );
}

/** Cream-theme big counter used between FinalShift and Waitlist. */
function WaitlistCountLarge() {
  return (
    <WaitlistCount variant="badge" className="text-base sm:text-lg text-ink-700">
      {(n) => (
        <span className="inline-flex items-baseline gap-2">
          <span className="font-serif text-5xl sm:text-7xl text-ink-950 leading-none">
            {n.toLocaleString()}+
          </span>
          <span className="text-ink-700 text-sm sm:text-base">
            people on the waitlist
          </span>
        </span>
      )}
    </WaitlistCount>
  );
}
