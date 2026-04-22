import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MessageBubble({ role, content, isTyping = false }) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-md ${
          isUser ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-100"
        }`}
      >
        {!isUser ? (
          <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-[11px] font-semibold">W</span>
            WebMind
          </div>
        ) : null}

        {isTyping ? (
          <div className="flex items-center gap-1 py-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300" />
          </div>
        ) : isUser ? (
          <p className="m-0 whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-1">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
