import { useEffect, useRef, useState } from 'react';
import { fetchWaitlistStats } from '../../lib/api';

type Props = {
  /** Optional render function — receives the animated count. */
  children?: (n: number) => React.ReactNode;
  /** Visual preset — `badge` for inline, `hero` for a big block. */
  variant?: 'badge' | 'hero';
  className?: string;
};

/**
 * Fetches `/waitlist/stats` and renders the count with a short ease-out
 * animation. Fails silently (renders an empty span) if the backend is
 * down — marketing pages should never error.
 */
export default function WaitlistCount({
  children,
  variant = 'badge',
  className = '',
}: Props) {
  const [target, setTarget] = useState<number | null>(null);
  const animated = useCountUp(target ?? 0);

  useEffect(() => {
    let cancelled = false;
    fetchWaitlistStats()
      .then((s) => !cancelled && setTarget(s.displayed))
      .catch(() => {
        /* render nothing on failure */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (target === null) {
    // Reserve space so the layout doesn't jump when the number arrives.
    return <span className={className} aria-hidden />;
  }

  if (variant === 'hero') {
    return (
      <div className={className}>
        <span className="font-serif text-6xl sm:text-7xl text-ink-950 leading-none block">
          {animated.toLocaleString()}+
        </span>
        <p className="mt-3 text-sm text-ink-700">
          people already on the waitlist · and counting
        </p>
      </div>
    );
  }

  // Badge preset.
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        <span className="absolute inline-flex h-full w-full rounded-full bg-rust/60 animate-pulse-ring" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rust" />
      </span>
      {children ? (
        children(animated)
      ) : (
        <>
          <strong className="text-inherit font-semibold">
            {animated.toLocaleString()}
          </strong>
          &nbsp;already on the list
        </>
      )}
    </span>
  );
}

/**
 * Ramps a number from 0 → `to` over ~800ms with an ease-out-cubic curve,
 * using requestAnimationFrame so it never blocks the main thread.
 */
function useCountUp(to: number) {
  const [n, setN] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = 0;
    const start = performance.now();
    const duration = 800;
    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setN(Math.round(from + (to - from) * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [to]);

  return n;
}
