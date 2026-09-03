"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Upload, Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { askQuestion, listPapers, Source } from "@/lib/api";
import SourceCard from "@/components/SourceCard";
import ThemeToggle from "@/components/ThemeToggle";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

interface Turn {
  question: string;
  answer: string;
  sources: Source[];
}

const SUGGESTIONS = [
  "What is the attention mechanism in transformers?",
  "How do diffusion models generate images?",
  "What methods improve reasoning in LLMs?",
  "Why were residual connections important in ResNet?",
];

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);
  const [rerank, setRerank] = useState(true);
  const [error, setError] = useState("");
  const [paperCount, setPaperCount] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Live paper count from the backend
  const refreshCount = useCallback(async () => {
    try {
      const data = await listPapers();
      setPaperCount(data.count);
    } catch {
      setPaperCount(null);
    }
  }, []);

  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  // Refresh count when returning to the tab (e.g. after an upload)
  useEffect(() => {
    const onFocus = () => refreshCount();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshCount]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, loading]);

  const ask = useCallback(
    async (question: string) => {
      const q = question.trim();
      if (!q || loading) return;
      setInput("");
      setError("");
      setLoading(true);
      try {
        const res = await askQuestion(q, rerank);
        setTurns((t) => [
          ...t,
          { question: q, answer: res.answer, sources: res.sources },
        ]);
      } catch {
        setError("Couldn't reach the backend. Please try again in a moment.");
      } finally {
        setLoading(false);
      }
    },
    [loading, rerank]
  );

  function resetChat() {
    setTurns([]);
    setError("");
    setInput("");
  }

  const countLabel = paperCount === null ? "—" : paperCount;

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <button
          onClick={resetChat}
          className="flex items-center gap-2 transition-opacity hover:opacity-70"
          title="Start a new conversation"
        >
          <Sparkles size={18} style={{ color: "var(--accent)" }} />
          <h1 className="text-base font-semibold">SiftPaper</h1>
          <span className="mono text-xs ml-2" style={{ color: "var(--muted)" }}>
            {countLabel} papers · cs.AI
          </span>
        </button>

        <div className="flex items-center gap-4">
          {turns.length > 0 && (
            <button
              onClick={resetChat}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition-colors"
              style={{ border: "1px solid var(--border)", color: "var(--muted)" }}
            >
              <ArrowLeft size={14} />
              New chat
            </button>
          )}
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <span style={{ color: "var(--muted)" }}>Re-ranking</span>
            <button
              onClick={() => setRerank((r) => !r)}
              className="relative w-9 h-5 rounded-full transition-colors"
              style={{ background: rerank ? "var(--accent)" : "var(--border)" }}
            >
              <span
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                style={{ transform: rerank ? "translateX(18px)" : "translateX(2px)" }}
              />
            </button>
          </label>
          <ThemeToggle />
          <Link
            href="/upload"
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition-colors"
            style={{ border: "1px solid var(--border)", color: "var(--text)" }}
          >
            <Upload size={14} />
            Add paper
          </Link>
        </div>
      </header>

      {/* Conversation */}
      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-10">
          {turns.length === 0 && !loading && (
            <div className="mt-20">
              <div className="text-center mb-10">
                <p className="text-lg mb-2">
                  Ask across {countLabel} AI research papers
                </p>
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  Every answer is grounded in retrieved passages, with sources shown.
                </p>
              </div>

              {/* Starter questions */}
              <div className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => ask(s)}
                    className="text-left text-sm px-4 py-3 rounded-lg transition-colors"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* How it works */}
              <div
                className="mt-12 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs mono"
                style={{ color: "var(--muted)" }}
              >
                <span>question</span>
                <span style={{ color: "var(--accent)" }}>→</span>
                <span>vector search</span>
                <span style={{ color: "var(--accent)" }}>→</span>
                <span>cross-encoder re-rank</span>
                <span style={{ color: "var(--accent)" }}>→</span>
                <span>cited answer</span>
              </div>
            </div>
          )}

          {turns.map((turn, i) => (
            <div key={i} className="space-y-4">
              <div className="text-right">
                <span
                  className="inline-block px-4 py-2 rounded-lg text-sm"
                  style={{ background: "var(--accent-dim)", color: "var(--text)" }}
                >
                  {turn.question}
                </span>
              </div>
              <div>
                <div className="answer-body" style={{ color: "var(--text)" }}>
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {turn.answer}
                  </ReactMarkdown>
                </div>
                {turn.sources.length > 0 && (
                  <div className="mt-5 space-y-1.5">
                    <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>
                      Retrieved sources
                    </p>
                    {turn.sources.map((s, j) => (
                      <SourceCard key={j} source={s} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-1" style={{ color: "var(--muted)" }}>
              <span className="dot">●</span>
              <span className="dot">●</span>
              <span className="dot">●</span>
              <span className="ml-2 text-sm">Retrieving and reasoning…</span>
            </div>
          )}

          {error && (
            <div
              className="text-sm rounded-md px-4 py-3"
              style={{
                background: "var(--danger-bg)",
                border: "1px solid var(--danger-border)",
                color: "var(--danger-text)",
              }}
            >
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      {/* Input */}
      <footer className="px-6 py-4" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask(input)}
            placeholder="Ask a question about the papers…"
            className="flex-1 px-4 py-3 rounded-lg text-sm outline-none"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
          />
          <button
            onClick={() => ask(input)}
            disabled={loading || !input.trim()}
            className="px-4 py-3 rounded-lg flex items-center gap-2 text-sm font-medium transition-opacity disabled:opacity-40"
            style={{ background: "var(--accent)", color: "var(--accent-text)" }}
          >
            <Send size={16} />
          </button>
        </div>
      </footer>
    </div>
  );
}
