import { useMemo, useState } from "react";
import ChatInput from "./components/ChatInput";
import ChatWindow from "./components/ChatWindow";
import UrlInput from "./components/UrlInput";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function makeId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

export default function App() {
  const [url, setUrl] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState("");
  const [loadedTitle, setLoadedTitle] = useState("");
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const canChat = useMemo(() => Boolean(sessionId), [sessionId]);

  async function handleLoadUrl() {
    if (!url.trim()) return;
    setIsLoadingUrl(true);
    try {
      const res = await fetch(`${API_URL}/load-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "Could not load this URL.");

      setSessionId(data.session_id);
      setLoadedTitle(data.title);
      setMessages([]);
      setChatInput("");
    } catch (error) {
      alert(error.message || "Failed to load URL.");
    } finally {
      setIsLoadingUrl(false);
    }
  }

  async function handleSend() {
    if (!chatInput.trim() || !sessionId || isGenerating) return;

    const userMessage = { id: makeId(), role: "user", content: chatInput.trim() };
    setMessages((prev) => [...prev, userMessage]);
    const outgoingQuestion = chatInput.trim();
    setChatInput("");
    setIsGenerating(true);

    const aiId = makeId();
    setMessages((prev) => [...prev, { id: aiId, role: "assistant", content: "" }]);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message: outgoingQuestion }),
      });

      if (!res.ok || !res.body) {
        const errorJson = await res.json().catch(() => null);
        throw new Error(errorJson?.detail || "Failed to get response.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const payload = JSON.parse(line);

          if (payload.type === "token") {
            setMessages((prev) =>
              prev.map((msg) => (msg.id === aiId ? { ...msg, content: `${msg.content}${payload.value}` } : msg))
            );
          } else if (payload.type === "error") {
            throw new Error(payload.value || "Failed to generate response.");
          }
        }
      }
    } catch (error) {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === aiId ? { ...msg, content: error.message || "Something went wrong." } : msg))
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="h-full bg-bg text-slate-100">
      <div className="mx-auto flex h-full w-full max-w-4xl flex-col gap-4 p-4 md:p-6">
        <h1 className="text-xl font-semibold tracking-tight text-slate-100">WebMind Chat</h1>

        <UrlInput
          url={url}
          onUrlChange={setUrl}
          onLoad={handleLoadUrl}
          isLoading={isLoadingUrl}
          loadedTitle={loadedTitle}
        />

        <ChatWindow
          messages={messages.filter((m) => m.content || m.role === "user")}
          onPickPrompt={setChatInput}
          isGenerating={isGenerating}
        />

        <ChatInput
          value={chatInput}
          onChange={setChatInput}
          onSend={handleSend}
          disabled={!canChat}
          isGenerating={isGenerating}
        />
      </div>
    </div>
  );
}
