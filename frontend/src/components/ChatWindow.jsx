import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

const EXAMPLE_PROMPTS = [
  "Summarize this document",
  "What are the key findings?",
  "List the main topics covered",
  "What conclusions does this document make?",
];

export default function ChatWindow({ messages, onPickPrompt, isGenerating }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  const hasMessages = messages.length > 0;

  return (
    <div className="flex-1 overflow-y-auto rounded-xl border border-line bg-panel/50 p-4">
      {!hasMessages ? (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <p className="mb-3 text-slate-300">Ask questions about the loaded document.</p>
          <div className="flex flex-wrap justify-center gap-2">
            {EXAMPLE_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => onPickPrompt(prompt)}
                className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 transition hover:border-blue-500 hover:text-white"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <MessageBubble key={m.id} role={m.role} content={m.content} />
          ))}
          {isGenerating ? <MessageBubble role="assistant" content="" isTyping /> : null}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
