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

  // Mirror externally provided values (e.g. suggested query chips).
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
    <form onSubmit={submit} className="w-full flex gap-2">
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ask anything about your company..."
        className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-lg shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
        aria-label="Search query"
      />
      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-brand px-6 py-3 text-white font-medium shadow hover:bg-brand-dark disabled:opacity-50"
      >
        {busy ? 'Searching…' : 'Search'}
      </button>
    </form>
  );
}
