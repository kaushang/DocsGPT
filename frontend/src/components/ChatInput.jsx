export default function ChatInput({ value, onChange, onSend, disabled, isGenerating }) {
  const placeholder = disabled ? "Upload a document to start asking questions..." : "Ask anything about this document...";

  return (
    <div className="rounded-xl border border-line bg-panel/70 p-3">
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder={placeholder}
          disabled={disabled || isGenerating}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          onClick={onSend}
          disabled={disabled || isGenerating || !value.trim()}
          className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}
