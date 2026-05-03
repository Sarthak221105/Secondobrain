type Props = {
  answer: string;
  streaming?: boolean;
};

export default function AISummary({ answer, streaming }: Props) {
  if (!answer && !streaming) return null;
  return (
    <section className="relative overflow-hidden rounded-2xl border border-black/10 bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-rust via-rust-soft to-rust/40"
      />
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-rust font-mono">
          AI summary
        </span>
        {streaming && (
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-rust opacity-75 animate-pulse-ring" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-rust" />
          </span>
        )}
      </div>
      <p className="whitespace-pre-wrap text-[15px] text-ink-900 leading-relaxed font-serif">
        {answer || (
          <span className="text-ink-600 italic">Thinking…</span>
        )}
        {streaming && answer && (
          <span className="ml-0.5 inline-block w-1.5 h-4 align-[-2px] bg-rust animate-caret-blink" />
        )}
      </p>
    </section>
  );
}
