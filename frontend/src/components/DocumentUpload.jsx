import { useRef, useState } from "react";

export default function DocumentUpload({
  selectedFile,
  onFileSelect,
  onLoad,
  isUploading,
  loadedDocument,
  error,
}) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const acceptedTypes = ".pdf,.txt";

  function pickFile(file) {
    if (!file) return;
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".pdf") && !lower.endsWith(".txt")) return;
    onFileSelect(file);
  }

  return (
    <div className="rounded-xl border border-line bg-panel/70 p-4 shadow-xl shadow-black/20">
      <div
        className={`cursor-pointer rounded-lg border border-dashed p-5 text-center transition ${
          isDragging ? "border-blue-500 bg-slate-900/80" : "border-slate-700 bg-slate-900/40"
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          pickFile(e.dataTransfer.files?.[0] || null);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptedTypes}
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0] || null)}
        />
        <p className="text-sm text-slate-200">Drag and drop a PDF or TXT file here, or click to browse</p>
        {selectedFile ? <p className="mt-2 text-xs text-slate-400">Selected: {selectedFile.name}</p> : null}
      </div>

      <div className="mt-3">
        <button
          onClick={onLoad}
          disabled={isUploading || !selectedFile}
          className="inline-flex min-w-40 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-700"
        >
          {isUploading ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
              Processing document...
            </>
          ) : (
            "Load Document"
          )}
        </button>
      </div>

      {loadedDocument ? (
        <p className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          {loadedDocument.filename} loaded - {loadedDocument.chunksCreated} chunks indexed
        </p>
      ) : null}

      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
