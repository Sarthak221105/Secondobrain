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
    <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-gray-900 line-clamp-1">
          {result.title}
        </h3>
        <span className="shrink-0 text-xs uppercase tracking-wide text-brand bg-brand/10 px-2 py-0.5 rounded">
          {SOURCE_LABELS[result.source] ?? result.source}
        </span>
      </div>
      <p
        className="mt-2 text-sm text-gray-700 line-clamp-3"
        dangerouslySetInnerHTML={{ __html: result.snippet }}
      />
      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span>
          Owner: <span className="text-gray-700">{result.owner_email}</span>
        </span>
        <span>Last modified {modifiedStr}</span>
      </div>
    </article>
  );

  return result.url ? (
    <a href={result.url} target="_blank" rel="noreferrer noopener">
      {body}
    </a>
  ) : (
    body
  );
}
