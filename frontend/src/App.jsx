import { useMemo, useState } from "react";
import ChatInput from "./components/ChatInput";
import ChatWindow from "./components/ChatWindow";
import DocumentUpload from "./components/DocumentUpload";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function makeId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

export default function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState("");
  const [loadedDocument, setLoadedDocument] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const canChat = useMemo(() => Boolean(sessionId), [sessionId]);

  async function handleLoadDocument() {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch(`${API_URL}/upload-document`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "Could not load this document.");

      setSessionId(data.session_id);
      setLoadedDocument({
        filename: data.filename,
        chunksCreated: data.chunks_created,
      });
      setMessages([]);
      setChatInput("");
      setUploadError("");
    } catch (error) {
      setUploadError(error.message || "Failed to load document.");
      setSessionId("");
      setLoadedDocument(null);
    } finally {
      setIsUploading(false);
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

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.detail || "Failed to get response.");

      setMessages((prev) => prev.map((msg) => (msg.id === aiId ? { ...msg, content: data?.answer || "" } : msg)));
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
        <h1 className="text-xl font-semibold tracking-tight text-slate-100">DocsGPT</h1>

        <DocumentUpload
          selectedFile={selectedFile}
          onFileSelect={setSelectedFile}
          onLoad={handleLoadDocument}
          isUploading={isUploading}
          loadedDocument={loadedDocument}
          error={uploadError}
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
