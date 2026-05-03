import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Minimal cream-themed top nav.
 *
 * Layout: circle-dot logo + "Secondo Brain" wordmark on the left,
 * four centered anchor links, black pill CTA on the right. A subtle
 * backdrop fades in after the page is scrolled.
 */
export default function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <AnimatePresence>
        {scrolled && (
          <motion.div
            key="bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-cream-50/85 backdrop-blur-md border-b border-black/5"
          />
        )}
      </AnimatePresence>

      <div className="relative max-w-7xl mx-auto flex items-center justify-between px-5 sm:px-8 py-4">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-ink-950 shrink-0">
            <span className="w-2 h-2 rounded-full bg-rust" />
          </span>
          <span className="font-serif text-xl text-ink-950 tracking-tight">
            Secondo<span className="italic text-rust"> Brain</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-9 text-[15px] text-ink-900">
          <a href="#insight" className="hover:text-rust transition-colors">
            Insight
          </a>
          <a href="#system" className="hover:text-rust transition-colors">
            System
          </a>
          <a href="#decision-layer" className="hover:text-rust transition-colors">
            Decision Layer
          </a>
          <a href="#waitlist" className="hover:text-rust transition-colors">
            Waitlist
          </a>
        </nav>

        <a
          href="#waitlist"
          className="inline-flex items-center gap-1.5 rounded-full bg-ink-950 text-white text-sm font-medium px-5 py-2.5 hover:bg-ink-800 transition-colors"
        >
          Book a Demo
          <span aria-hidden>→</span>
        </a>
      </div>
    </motion.header>
  );
}
