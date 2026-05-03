import type { SearchResult } from '../lib/api';

const SOURCE_LABELS: Record<string, string> = {
  google_drive: 'Drive',
  slack: 'Slack',
  gmail: 'Gmail',
  jira: 'Jira',
  upload: 'Upload',
};

export default function ResultCard({ result }: { result: SearchResult }) {
  const modified = new Date(result.last_modified);
  const modifiedStr = isNaN(modified.getTime())
    ? result.last_modified
    : modified.toLocaleDateString();

  const body = (
    <article className="group relative overflow-hidden rounded-2xl border border-black/10 bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.04)] hover:border-rust/40 hover:shadow-[0_14px_40px_-18px_rgba(194,85,59,0.25)] hover:-translate-y-0.5 transition-all">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-serif text-lg text-ink-950 line-clamp-1 group-hover:text-rust-dark transition-colors">
          {result.title}
        </h3>
        <span className="shrink-0 inline-flex items-center rounded-full border border-black/10 bg-cream-50/70 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-ink-700">
          {SOURCE_LABELS[result.source] ?? result.source}
        </span>
      </div>
      <p
        className="mt-2.5 text-sm text-ink-700 leading-relaxed line-clamp-3"
        dangerouslySetInnerHTML={{ __html: result.snippet }}
      />
      <div className="mt-4 flex items-center justify-between text-[11px] font-mono text-ink-600">
        <span className="truncate">
          <span className="uppercase tracking-[0.18em] mr-1.5">Owner</span>
          <span className="text-ink-800 normal-case tracking-normal">
            {result.owner_email}
          </span>
        </span>
        <span className="shrink-0">{modifiedStr}</span>
      </div>
    </article>
  );

  return result.url ? (
    <a
      href={result.url}
      target="_blank"
      rel="noreferrer noopener"
      className="block"
    >
      {body}
    </a>
  ) : (
    body
  );
}
