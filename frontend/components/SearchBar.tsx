import { FormEvent, useEffect, useState } from 'react';

type Props = {
  onSearch: (q: string) => void;
  busy?: boolean;
  /** Optional initial value — only used on first mount. */
  initialValue?: string;
  /**
   * When provided, the input will update to this value whenever it changes
   * (so e.g. clicking a suggested-query chip can populate the box). The
   * user can still edit freely after that.
   */
  externalValue?: string;
};

export default function SearchBar({
  onSearch,
  busy,
  initialValue = '',
  externalValue,
}: Props) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (externalValue !== undefined) setValue(externalValue);
  }, [externalValue]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSearch(trimmed);
  }

  return (
    <form
      onSubmit={submit}
      className="group relative w-full flex flex-col sm:flex-row gap-3"
    >
      <div className="relative flex-1">
        <span
          aria-hidden
          className="absolute left-5 top-1/2 -translate-y-1/2 text-ink-600 group-focus-within:text-rust transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </span>
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ask anything about your company…"
          className="w-full rounded-full bg-white/80 backdrop-blur border border-black/10 pl-12 pr-5 py-3.5 text-[15px] text-ink-900 placeholder-ink-600/60 focus:border-rust focus:outline-none focus:ring-2 focus:ring-rust/20 transition-colors"
          aria-label="Search query"
        />
      </div>
      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center justify-center gap-1.5 rounded-full bg-ink-950 text-white px-6 py-3.5 text-[15px] font-medium hover:bg-ink-800 transition-colors disabled:opacity-60"
      >
        {busy ? (
          <>
            <span className="h-2 w-2 rounded-full bg-rust animate-pulse" />
            Searching…
          </>
        ) : (
          <>
            Search
            <span aria-hidden>→</span>
          </>
        )}
      </button>
    </form>
  );
}
