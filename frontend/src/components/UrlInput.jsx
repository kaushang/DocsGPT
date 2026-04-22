export default function UrlInput({ url, onUrlChange, onLoad, isLoading, loadedTitle }) {
  return (
    <div className="rounded-xl border border-line bg-panel/70 p-4 shadow-xl shadow-black/20">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="Paste any webpage URL..."
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500"
        />
        <button
          onClick={onLoad}
          disabled={isLoading || !url.trim()}
          className="inline-flex min-w-36 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-700"
        >
          {isLoading ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
              Fetching...
            </>
          ) : (
            "Load Page"
          )}
        </button>
      </div>
      {loadedTitle ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Loaded: {loadedTitle}
        </p>
      ) : null}
    </div>
  );
}
