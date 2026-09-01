import { FileText } from "lucide-react";
import { Source } from "@/lib/api";

export default function SourceCard({ source }: { source: Source }) {
  return (
    <div
      className="flex items-center gap-3 rounded-md px-3 py-2 mono text-sm"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <FileText size={15} style={{ color: "var(--accent)", flexShrink: 0 }} />
      <span className="truncate" style={{ color: "var(--text)" }}>
        {source.source}
      </span>
      <span style={{ color: "var(--muted)" }}>·</span>
      <span style={{ color: "var(--muted)", flexShrink: 0 }}>
        p.{source.page}
      </span>
      <span
        className="ml-auto tabular-nums flex-shrink-0"
        style={{ color: "var(--accent)" }}
      >
        {source.score.toFixed(3)}
      </span>
    </div>
  );
}