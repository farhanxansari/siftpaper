export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface Source {
  source: string;
  page: number;
  score: number;
}

export interface QueryResponse {
  question: string;
  answer: string;
  sources: Source[];
}

export async function askQuestion(
  question: string,
  rerank: boolean
): Promise<QueryResponse> {
  const res = await fetch(`${API_URL}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, top_k: 5, rerank }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function listPapers(): Promise<{ papers: string[]; count: number }> {
  const res = await fetch(`${API_URL}/papers`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function ingestPaper(file: File): Promise<{
  filename: string;
  chunks_indexed: number;
  status: string;
}> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_URL}/ingest`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}