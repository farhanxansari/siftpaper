"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, UploadCloud, FileText, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { listPapers, ingestPaper } from "@/lib/api";
import ThemeToggle from "@/components/ThemeToggle";

export default function UploadPage() {
  const [papers, setPapers] = useState<string[]>([]);
  const [count, setCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState("");

  const refresh = useCallback(async () => {
    try {
      const data = await listPapers();
      setPapers(data.papers);
      setCount(data.count);
    } catch {
      setStatus("Couldn't load papers. Is the API running?");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleFile(file: File) {
    if (!file.name.endsWith(".pdf")) {
      setStatus("Only PDF files are supported.");
      return;
    }
    setUploading(true);
    setStatus(`Processing ${file.name}…`);
    try {
      const res = await ingestPaper(file);
      setStatus(`Indexed ${file.name} — ${res.chunks_indexed} chunks added.`);
      await refresh();
    } catch {
      setStatus(`Failed to index ${file.name}.`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm"
            style={{ color: "var(--muted)" }}
          >
            <ArrowLeft size={15} />
            Back to chat
          </Link>
          <ThemeToggle />
        </div>

        <h1 className="text-xl font-semibold mb-1">Add a paper</h1>
        <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>
          Drop a PDF to chunk, embed, and index it into the knowledge base.
        </p>

        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
          }}
          className="rounded-xl p-12 text-center transition-colors"
          style={{
            border: `2px dashed ${dragOver ? "var(--accent)" : "var(--border)"}`,
            background: dragOver ? "var(--surface-hover)" : "var(--surface)",
          }}
        >
          <UploadCloud
            size={36}
            style={{ color: "var(--accent)", margin: "0 auto 12px" }}
          />
          <p className="text-sm mb-3">Drag a PDF here, or</p>
          <label
            className="inline-block text-sm px-4 py-2 rounded-md cursor-pointer"
            style={{ background: "var(--accent)", color: "var(--accent-text)" }}
          >
            Choose file
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              disabled={uploading}
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </label>
        </div>

        {status && (
          <div
            className="mt-4 flex items-center gap-2 text-sm rounded-md px-4 py-3"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            {!uploading && status.startsWith("Indexed") && (
              <CheckCircle2 size={16} style={{ color: "var(--accent)" }} />
            )}
            <span style={{ color: "var(--muted)" }}>{status}</span>
          </div>
        )}

        {/* Indexed papers */}
        <div className="mt-10">
          <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>
            Indexed papers ({count})
          </p>
          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {papers.map((p) => (
              <div
                key={p}
                className="flex items-center gap-3 rounded-md px-3 py-2 mono text-sm"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <FileText size={14} style={{ color: "var(--muted)", flexShrink: 0 }} />
                <span className="truncate">{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}