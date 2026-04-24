type Props = {
  answer: string;
  streaming?: boolean;
};

export default function AISummary({ answer, streaming }: Props) {
  if (!answer && !streaming) return null;
  return (
    <section className="rounded-lg border border-brand/30 bg-brand/5 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-brand">
          AI summary
        </span>
        {streaming && (
          <span className="h-2 w-2 animate-pulse rounded-full bg-brand" />
        )}
      </div>
      <p className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
        {answer || '…'}
      </p>
    </section>
  );
}
